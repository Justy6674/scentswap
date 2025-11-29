-- =============================================================================
-- AI FRAGRANCE ENHANCEMENT SYSTEM DATABASE SCHEMA
-- =============================================================================

-- Enhancement request queue and tracking
CREATE TABLE IF NOT EXISTS fragrance_enhancement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fragrance_id UUID NOT NULL REFERENCES fragrance_master(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Request metadata
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  enhancement_type TEXT NOT NULL CHECK (enhancement_type IN ('ai_analysis', 'web_scrape', 'hybrid', 'manual')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest priority

  -- Processing metadata
  processing_notes TEXT,
  error_message TEXT,
  confidence_threshold FLOAT DEFAULT 0.7 CHECK (confidence_threshold BETWEEN 0.0 AND 1.0),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT fk_enhancement_fragrance FOREIGN KEY (fragrance_id) REFERENCES fragrance_master(id),
  CONSTRAINT fk_enhancement_admin FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Individual field changes for approval workflow
CREATE TABLE IF NOT EXISTS fragrance_enhancement_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES fragrance_enhancement_requests(id) ON DELETE CASCADE,

  -- Field change data
  field_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('addition', 'update', 'correction', 'enhancement')),

  -- Quality metrics
  confidence_score FLOAT NOT NULL DEFAULT 0.8 CHECK (confidence_score BETWEEN 0.0 AND 1.0),
  source TEXT NOT NULL CHECK (source IN ('fragrantica_scrape', 'brand_website', 'ai_gemini', 'ai_openai', 'ai_hybrid', 'manual_entry')),
  source_url TEXT, -- Original source URL if scraped

  -- Approval workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Metadata
  notes TEXT, -- Admin notes or AI reasoning
  validation_errors TEXT[], -- Any validation issues found

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_change_request FOREIGN KEY (request_id) REFERENCES fragrance_enhancement_requests(id),
  CONSTRAINT fk_change_approver FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Enhancement processing logs for debugging and analytics
CREATE TABLE IF NOT EXISTS fragrance_enhancement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES fragrance_enhancement_requests(id) ON DELETE CASCADE,

  -- Log data
  log_level TEXT NOT NULL CHECK (log_level IN ('info', 'warning', 'error', 'debug')),
  message TEXT NOT NULL,
  context JSONB, -- Additional structured data

  -- Source tracking
  component TEXT, -- Which part of the system generated this log
  function_name TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_log_request FOREIGN KEY (request_id) REFERENCES fragrance_enhancement_requests(id)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Enhancement requests indexes
CREATE INDEX IF NOT EXISTS idx_enhancement_requests_fragrance_id ON fragrance_enhancement_requests(fragrance_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_requests_admin_id ON fragrance_enhancement_requests(admin_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_requests_status ON fragrance_enhancement_requests(status);
CREATE INDEX IF NOT EXISTS idx_enhancement_requests_created_at ON fragrance_enhancement_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhancement_requests_status_priority ON fragrance_enhancement_requests(status, priority ASC) WHERE status = 'pending';

-- Enhancement changes indexes
CREATE INDEX IF NOT EXISTS idx_enhancement_changes_request_id ON fragrance_enhancement_changes(request_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_changes_status ON fragrance_enhancement_changes(status);
CREATE INDEX IF NOT EXISTS idx_enhancement_changes_field_name ON fragrance_enhancement_changes(field_name);
CREATE INDEX IF NOT EXISTS idx_enhancement_changes_confidence ON fragrance_enhancement_changes(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_enhancement_changes_pending ON fragrance_enhancement_changes(status, confidence_score DESC) WHERE status = 'pending';

-- Enhancement logs indexes
CREATE INDEX IF NOT EXISTS idx_enhancement_logs_request_id ON fragrance_enhancement_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_logs_level_created ON fragrance_enhancement_logs(log_level, created_at DESC);

-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_enhancement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enhancement_requests_updated_at
  BEFORE UPDATE ON fragrance_enhancement_requests
  FOR EACH ROW EXECUTE FUNCTION update_enhancement_updated_at();

CREATE TRIGGER trg_enhancement_changes_updated_at
  BEFORE UPDATE ON fragrance_enhancement_changes
  FOR EACH ROW EXECUTE FUNCTION update_enhancement_updated_at();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get enhancement queue summary
CREATE OR REPLACE FUNCTION get_enhancement_queue_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'pending_requests', (SELECT COUNT(*) FROM fragrance_enhancement_requests WHERE status = 'pending'),
    'processing_requests', (SELECT COUNT(*) FROM fragrance_enhancement_requests WHERE status = 'processing'),
    'pending_approvals', (SELECT COUNT(*) FROM fragrance_enhancement_changes WHERE status = 'pending'),
    'high_confidence_changes', (SELECT COUNT(*) FROM fragrance_enhancement_changes WHERE status = 'pending' AND confidence_score >= 0.9),
    'total_completed_today', (SELECT COUNT(*) FROM fragrance_enhancement_requests WHERE status = 'completed' AND DATE(completed_at) = CURRENT_DATE),
    'avg_processing_time_minutes', (
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60), 2)
      FROM fragrance_enhancement_requests
      WHERE status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get fragrances that need enhancement
CREATE OR REPLACE FUNCTION get_fragrances_needing_enhancement(
  p_limit INTEGER DEFAULT 50,
  p_brand_filter TEXT DEFAULT NULL,
  p_missing_fields TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  brand TEXT,
  fragrantica_url TEXT,
  completeness_score FLOAT,
  missing_fields TEXT[],
  last_enhanced_at TIMESTAMP WITH TIME ZONE,
  priority_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fm.id,
    fm.name,
    fm.brand,
    fm.fragrantica_url,
    -- Calculate completeness score
    (
      CASE WHEN fm.name IS NOT NULL THEN 1.0 ELSE 0.0 END +
      CASE WHEN fm.brand IS NOT NULL THEN 1.0 ELSE 0.0 END +
      CASE WHEN fm.description IS NOT NULL THEN 1.0 ELSE 0.0 END +
      CASE WHEN fm.concentration IS NOT NULL THEN 1.0 ELSE 0.0 END +
      CASE WHEN fm.family IS NOT NULL THEN 1.0 ELSE 0.0 END +
      CASE WHEN fm.top_notes IS NOT NULL AND array_length(fm.top_notes, 1) > 0 THEN 1.0 ELSE 0.0 END +
      CASE WHEN fm.middle_notes IS NOT NULL AND array_length(fm.middle_notes, 1) > 0 THEN 1.0 ELSE 0.0 END +
      CASE WHEN fm.base_notes IS NOT NULL AND array_length(fm.base_notes, 1) > 0 THEN 1.0 ELSE 0.0 END +
      CASE WHEN fm.main_accords IS NOT NULL AND array_length(fm.main_accords, 1) > 0 THEN 1.0 ELSE 0.0 END +
      CASE WHEN fm.perfumers IS NOT NULL AND array_length(fm.perfumers, 1) > 0 THEN 1.0 ELSE 0.0 END +
      CASE WHEN fm.image_url IS NOT NULL THEN 1.0 ELSE 0.0 END +
      CASE WHEN fm.year_released IS NOT NULL THEN 1.0 ELSE 0.0 END
    ) / 12.0 AS completeness_score,
    -- List missing fields
    ARRAY(
      SELECT field_name FROM (
        SELECT 'description' as field_name WHERE fm.description IS NULL
        UNION SELECT 'concentration' WHERE fm.concentration IS NULL
        UNION SELECT 'family' WHERE fm.family IS NULL
        UNION SELECT 'top_notes' WHERE fm.top_notes IS NULL OR array_length(fm.top_notes, 1) = 0
        UNION SELECT 'middle_notes' WHERE fm.middle_notes IS NULL OR array_length(fm.middle_notes, 1) = 0
        UNION SELECT 'base_notes' WHERE fm.base_notes IS NULL OR array_length(fm.base_notes, 1) = 0
        UNION SELECT 'main_accords' WHERE fm.main_accords IS NULL OR array_length(fm.main_accords, 1) = 0
        UNION SELECT 'perfumers' WHERE fm.perfumers IS NULL OR array_length(fm.perfumers, 1) = 0
        UNION SELECT 'image_url' WHERE fm.image_url IS NULL
        UNION SELECT 'year_released' WHERE fm.year_released IS NULL
      ) missing
    ) AS missing_fields,
    -- Last enhancement timestamp
    (
      SELECT MAX(completed_at)
      FROM fragrance_enhancement_requests fer
      WHERE fer.fragrance_id = fm.id AND fer.status = 'completed'
    ) AS last_enhanced_at,
    -- Priority score (lower number = higher priority)
    (
      CASE
        WHEN fm.rating_value IS NULL THEN 1  -- Missing rating = high priority
        WHEN fm.rating_value < 3.0 THEN 3    -- Low rating = medium priority
        WHEN fm.description IS NULL THEN 2   -- Missing description = high priority
        ELSE 5                               -- Default priority
      END
    ) AS priority_score
  FROM fragrance_master fm
  WHERE
    (p_brand_filter IS NULL OR fm.brand ILIKE '%' || p_brand_filter || '%')
    AND fm.fragrantica_url IS NOT NULL  -- Must have a source URL
    -- Not currently being processed
    AND NOT EXISTS (
      SELECT 1 FROM fragrance_enhancement_requests fer
      WHERE fer.fragrance_id = fm.id AND fer.status IN ('pending', 'processing')
    )
    -- Filter by missing fields if specified
    AND (
      p_missing_fields IS NULL
      OR EXISTS (
        SELECT 1 FROM unnest(p_missing_fields) AS required_field
        WHERE
          (required_field = 'description' AND fm.description IS NULL) OR
          (required_field = 'concentration' AND fm.concentration IS NULL) OR
          (required_field = 'family' AND fm.family IS NULL) OR
          (required_field = 'top_notes' AND (fm.top_notes IS NULL OR array_length(fm.top_notes, 1) = 0)) OR
          (required_field = 'middle_notes' AND (fm.middle_notes IS NULL OR array_length(fm.middle_notes, 1) = 0)) OR
          (required_field = 'base_notes' AND (fm.base_notes IS NULL OR array_length(fm.base_notes, 1) = 0)) OR
          (required_field = 'main_accords' AND (fm.main_accords IS NULL OR array_length(fm.main_accords, 1) = 0)) OR
          (required_field = 'perfumers' AND (fm.perfumers IS NULL OR array_length(fm.perfumers, 1) = 0)) OR
          (required_field = 'image_url' AND fm.image_url IS NULL) OR
          (required_field = 'year_released' AND fm.year_released IS NULL)
      )
    )
  ORDER BY priority_score ASC, completeness_score ASC, fm.rating_value DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RPC FUNCTIONS FOR API ACCESS
-- =============================================================================

-- Create enhancement request
CREATE OR REPLACE FUNCTION create_enhancement_request(
  p_fragrance_id UUID,
  p_admin_id UUID,
  p_enhancement_type TEXT,
  p_priority INTEGER DEFAULT 5,
  p_confidence_threshold FLOAT DEFAULT 0.7
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
BEGIN
  INSERT INTO fragrance_enhancement_requests (
    fragrance_id,
    admin_id,
    enhancement_type,
    priority,
    confidence_threshold
  ) VALUES (
    p_fragrance_id,
    p_admin_id,
    p_enhancement_type,
    p_priority,
    p_confidence_threshold
  ) RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update request status
CREATE OR REPLACE FUNCTION update_enhancement_request_status(
  p_request_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL,
  p_processing_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE fragrance_enhancement_requests
  SET
    status = p_status,
    error_message = p_error_message,
    processing_notes = p_processing_notes,
    started_at = CASE WHEN p_status = 'processing' AND started_at IS NULL THEN NOW() ELSE started_at END,
    completed_at = CASE WHEN p_status IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE completed_at END,
    updated_at = NOW()
  WHERE id = p_request_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create enhancement changes (batch insert)
CREATE OR REPLACE FUNCTION create_enhancement_changes(
  p_request_id UUID,
  p_changes JSONB -- Array of change objects
)
RETURNS INTEGER AS $$
DECLARE
  v_change JSONB;
  v_inserted_count INTEGER := 0;
BEGIN
  FOR v_change IN SELECT * FROM jsonb_array_elements(p_changes)
  LOOP
    INSERT INTO fragrance_enhancement_changes (
      request_id,
      field_name,
      old_value,
      new_value,
      change_type,
      confidence_score,
      source,
      source_url,
      notes
    ) VALUES (
      p_request_id,
      v_change->>'field_name',
      v_change->'old_value',
      v_change->'new_value',
      COALESCE(v_change->>'change_type', 'enhancement'),
      COALESCE((v_change->>'confidence_score')::FLOAT, 0.8),
      v_change->>'source',
      v_change->>'source_url',
      v_change->>'notes'
    );

    v_inserted_count := v_inserted_count + 1;
  END LOOP;

  RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply approved changes to fragrance_master
CREATE OR REPLACE FUNCTION apply_enhancement_changes(
  p_change_ids UUID[],
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_change RECORD;
  v_fragrance_id UUID;
  v_applied_count INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_update_fields JSONB := '{}'::JSONB;
BEGIN
  -- Get fragrance_id and validate all changes belong to same fragrance
  SELECT DISTINCT fer.fragrance_id INTO v_fragrance_id
  FROM fragrance_enhancement_changes fec
  JOIN fragrance_enhancement_requests fer ON fec.request_id = fer.id
  WHERE fec.id = ANY(p_change_ids);

  IF v_fragrance_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No valid changes found');
  END IF;

  -- Build update query dynamically
  FOR v_change IN
    SELECT fec.*, fer.fragrance_id
    FROM fragrance_enhancement_changes fec
    JOIN fragrance_enhancement_requests fer ON fec.request_id = fer.id
    WHERE fec.id = ANY(p_change_ids) AND fec.status = 'pending'
  LOOP
    BEGIN
      -- Mark change as approved
      UPDATE fragrance_enhancement_changes
      SET
        status = 'approved',
        approved_by = p_admin_id,
        approved_at = NOW()
      WHERE id = v_change.id;

      -- Collect field updates
      v_update_fields := v_update_fields || jsonb_build_object(v_change.field_name, v_change.new_value);
      v_applied_count := v_applied_count + 1;

    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || (v_change.field_name || ': ' || SQLERRM);
    END;
  END LOOP;

  -- Apply all changes to fragrance_master in one update
  IF v_applied_count > 0 THEN
    EXECUTE format(
      'UPDATE fragrance_master SET %s, updated_at = NOW() WHERE id = $1',
      (
        SELECT string_agg(
          format('%I = $1.%I', key, key),
          ', '
        )
        FROM jsonb_each(v_update_fields)
      )
    ) USING v_update_fields, v_fragrance_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'applied_count', v_applied_count,
    'errors', v_errors,
    'fragrance_id', v_fragrance_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- GRANTS AND SECURITY
-- =============================================================================

-- Grant access to authenticated users (adjust based on your auth system)
GRANT SELECT, INSERT, UPDATE ON fragrance_enhancement_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON fragrance_enhancement_changes TO authenticated;
GRANT SELECT, INSERT ON fragrance_enhancement_logs TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_enhancement_queue_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_fragrances_needing_enhancement(INTEGER, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION create_enhancement_request(UUID, UUID, TEXT, INTEGER, FLOAT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_enhancement_request_status(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_enhancement_changes(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_enhancement_changes(UUID[], UUID) TO authenticated;

-- Row Level Security (RLS) - Enable if using Supabase auth
-- ALTER TABLE fragrance_enhancement_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fragrance_enhancement_changes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fragrance_enhancement_logs ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (uncomment if using Supabase auth)
-- CREATE POLICY "Admin users can access all enhancement requests" ON fragrance_enhancement_requests
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM users
--       WHERE id = auth.uid() AND is_admin = true
--     )
--   );

-- =============================================================================
-- ROLLBACK AND ERROR HANDLING TABLES
-- =============================================================================

-- Rollback points for fragrance data snapshots
CREATE TABLE IF NOT EXISTS fragrance_rollback_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fragrance_id UUID NOT NULL REFERENCES fragrance_master(id) ON DELETE CASCADE,
  enhancement_request_id UUID NOT NULL REFERENCES fragrance_enhancement_requests(id) ON DELETE CASCADE,

  -- Snapshot data
  snapshot_data JSONB NOT NULL, -- Complete fragrance data before changes
  applied_change_ids UUID[] NOT NULL DEFAULT '{}', -- IDs of changes that were applied

  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rollback_reason TEXT,

  -- Indexes
  CONSTRAINT fk_rollback_fragrance FOREIGN KEY (fragrance_id) REFERENCES fragrance_master(id),
  CONSTRAINT fk_rollback_request FOREIGN KEY (enhancement_request_id) REFERENCES fragrance_enhancement_requests(id),
  CONSTRAINT fk_rollback_admin FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Rollback history tracking
CREATE TABLE IF NOT EXISTS fragrance_rollback_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_rollback_point_id UUID NOT NULL REFERENCES fragrance_rollback_points(id) ON DELETE CASCADE,
  fragrance_id UUID NOT NULL REFERENCES fragrance_master(id) ON DELETE CASCADE,

  -- Rollback details
  rollback_reason TEXT NOT NULL,
  reverted_fields TEXT[] NOT NULL DEFAULT '{}',
  performed_by UUID NOT NULL REFERENCES users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Results
  success BOOLEAN NOT NULL DEFAULT TRUE,
  errors TEXT[], -- Any errors that occurred during rollback

  -- Indexes
  CONSTRAINT fk_rollback_history_point FOREIGN KEY (original_rollback_point_id) REFERENCES fragrance_rollback_points(id),
  CONSTRAINT fk_rollback_history_fragrance FOREIGN KEY (fragrance_id) REFERENCES fragrance_master(id),
  CONSTRAINT fk_rollback_history_admin FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- Error tracking for enhancement operations
CREATE TABLE IF NOT EXISTS fragrance_enhancement_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES fragrance_enhancement_requests(id) ON DELETE CASCADE,
  fragrance_id UUID REFERENCES fragrance_master(id) ON DELETE CASCADE,

  -- Error details
  error_type TEXT NOT NULL CHECK (error_type IN ('network', 'parsing', 'validation', 'ai_processing', 'database', 'permission', 'rate_limit', 'unknown')),
  error_message TEXT NOT NULL,
  error_stack TEXT, -- Full error stack trace
  error_context JSONB, -- Additional context about the error

  -- Recovery information
  is_recoverable BOOLEAN DEFAULT TRUE,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,

  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Indexes
  CONSTRAINT fk_error_request FOREIGN KEY (request_id) REFERENCES fragrance_enhancement_requests(id),
  CONSTRAINT fk_error_fragrance FOREIGN KEY (fragrance_id) REFERENCES fragrance_master(id),
  CONSTRAINT fk_error_admin FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =============================================================================
-- ROLLBACK AND ERROR HANDLING FUNCTIONS
-- =============================================================================

-- Function to create automatic rollback points before applying changes
CREATE OR REPLACE FUNCTION create_automatic_rollback_point(
  p_fragrance_id UUID,
  p_request_id UUID,
  p_admin_id UUID
)
RETURNS UUID AS $$
DECLARE
  rollback_point_id UUID;
  fragrance_snapshot JSONB;
BEGIN
  -- Get current fragrance data
  SELECT to_jsonb(fm.*) INTO fragrance_snapshot
  FROM fragrance_master fm
  WHERE fm.id = p_fragrance_id;

  IF fragrance_snapshot IS NULL THEN
    RAISE EXCEPTION 'Fragrance not found: %', p_fragrance_id;
  END IF;

  -- Create rollback point
  INSERT INTO fragrance_rollback_points (
    fragrance_id,
    enhancement_request_id,
    snapshot_data,
    created_by
  ) VALUES (
    p_fragrance_id,
    p_request_id,
    fragrance_snapshot,
    p_admin_id
  )
  RETURNING id INTO rollback_point_id;

  RETURN rollback_point_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate fragrance data integrity
CREATE OR REPLACE FUNCTION validate_fragrance_integrity(p_fragrance_id UUID)
RETURNS JSONB AS $$
DECLARE
  fragrance_data RECORD;
  validation_result JSONB := '{"is_valid": true, "errors": [], "warnings": []}';
  errors TEXT[] := '{}';
  warnings TEXT[] := '{}';
BEGIN
  -- Get fragrance data
  SELECT * INTO fragrance_data
  FROM fragrance_master
  WHERE id = p_fragrance_id;

  IF NOT FOUND THEN
    errors := array_append(errors, 'Fragrance not found');
    validation_result := jsonb_set(validation_result, '{is_valid}', 'false');
    validation_result := jsonb_set(validation_result, '{errors}', to_jsonb(errors));
    RETURN validation_result;
  END IF;

  -- Validate required fields
  IF fragrance_data.name IS NULL OR LENGTH(TRIM(fragrance_data.name)) = 0 THEN
    errors := array_append(errors, 'Fragrance name is required');
  END IF;

  IF fragrance_data.brand IS NULL OR LENGTH(TRIM(fragrance_data.brand)) = 0 THEN
    errors := array_append(errors, 'Brand is required');
  END IF;

  -- Validate rating ranges
  IF fragrance_data.rating_value IS NOT NULL AND (fragrance_data.rating_value < 0 OR fragrance_data.rating_value > 5) THEN
    errors := array_append(errors, 'Rating value must be between 0 and 5');
  END IF;

  IF fragrance_data.longevity_rating IS NOT NULL AND (fragrance_data.longevity_rating < 0 OR fragrance_data.longevity_rating > 5) THEN
    errors := array_append(errors, 'Longevity rating must be between 0 and 5');
  END IF;

  IF fragrance_data.sillage_rating IS NOT NULL AND (fragrance_data.sillage_rating < 0 OR fragrance_data.sillage_rating > 5) THEN
    errors := array_append(errors, 'Sillage rating must be between 0 and 5');
  END IF;

  -- Validate year
  IF fragrance_data.year_released IS NOT NULL AND (fragrance_data.year_released < 1800 OR fragrance_data.year_released > EXTRACT(YEAR FROM NOW()) + 2) THEN
    errors := array_append(errors, 'Year released must be between 1800 and current year + 2');
  END IF;

  -- Check for warnings
  IF fragrance_data.description IS NULL OR LENGTH(TRIM(fragrance_data.description)) < 10 THEN
    warnings := array_append(warnings, 'Description is very short or missing');
  END IF;

  IF fragrance_data.main_accords IS NULL OR jsonb_array_length(fragrance_data.main_accords) = 0 THEN
    warnings := array_append(warnings, 'No main accords specified');
  END IF;

  IF fragrance_data.concentration IS NULL THEN
    warnings := array_append(warnings, 'Concentration not specified');
  END IF;

  -- Set validation result
  IF array_length(errors, 1) > 0 THEN
    validation_result := jsonb_set(validation_result, '{is_valid}', 'false');
  END IF;

  validation_result := jsonb_set(validation_result, '{errors}', to_jsonb(errors));
  validation_result := jsonb_set(validation_result, '{warnings}', to_jsonb(warnings));

  RETURN validation_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record enhancement errors
CREATE OR REPLACE FUNCTION record_enhancement_error(
  p_request_id UUID,
  p_fragrance_id UUID,
  p_error_type TEXT,
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL,
  p_error_context JSONB DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  error_id UUID;
BEGIN
  INSERT INTO fragrance_enhancement_errors (
    request_id,
    fragrance_id,
    error_type,
    error_message,
    error_stack,
    error_context,
    created_by
  ) VALUES (
    p_request_id,
    p_fragrance_id,
    p_error_type,
    p_error_message,
    p_error_stack,
    p_error_context,
    p_admin_id
  )
  RETURNING id INTO error_id;

  RETURN error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for old logs
CREATE OR REPLACE FUNCTION cleanup_old_enhancement_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete logs older than 90 days
  DELETE FROM fragrance_enhancement_logs
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for old rollback points
CREATE OR REPLACE FUNCTION cleanup_old_rollback_points()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete rollback points older than 30 days
  DELETE FROM fragrance_rollback_points
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ADDITIONAL GRANTS FOR ROLLBACK SYSTEM
-- =============================================================================

-- Grant access to rollback tables
GRANT SELECT, INSERT, UPDATE ON fragrance_rollback_points TO authenticated;
GRANT SELECT, INSERT ON fragrance_rollback_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON fragrance_enhancement_errors TO authenticated;

-- Grant execute on rollback functions
GRANT EXECUTE ON FUNCTION create_automatic_rollback_point(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_fragrance_integrity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_enhancement_error(UUID, UUID, TEXT, TEXT, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_enhancement_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_rollback_points() TO authenticated;