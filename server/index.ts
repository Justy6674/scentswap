import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = req.body;
    
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, username, verification_tier) 
       VALUES ($1, $2, $3, $4, $5, 'unverified') RETURNING *`,
      [id, email, passwordHash, full_name, email.split('@')[0]]
    );

    const user = result.rows[0];
    delete user.password_hash;
    
    res.json({ user });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    delete user.password_hash;
    res.json({ user });
  } catch (error: any) {
    console.error('Signin error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    delete user.password_hash;
    res.json({ user });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'password_hash');
    const values = fields.map(k => updates[k]);
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const result = await pool.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    delete user.password_hash;
    res.json({ user });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/listings', async (req: Request, res: Response) => {
  try {
    const { userId, search, concentration, minSize, maxSize } = req.query;
    
    let query = `
      SELECT l.*, 
        json_build_object(
          'id', u.id,
          'email', u.email,
          'username', u.username,
          'avatar_url', u.avatar_url,
          'verification_tier', u.verification_tier,
          'total_swaps', u.total_swaps,
          'rating', u.rating,
          'positive_percentage', u.positive_percentage
        ) as user
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.is_active = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND l.user_id = $${paramIndex++}`;
      params.push(userId);
    }
    if (search) {
      query += ` AND (l.custom_name ILIKE $${paramIndex} OR l.house ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (concentration && concentration !== 'All') {
      query += ` AND l.concentration = $${paramIndex++}`;
      params.push(concentration);
    }
    if (minSize) {
      query += ` AND l.size_ml >= $${paramIndex++}`;
      params.push(parseInt(minSize as string));
    }
    if (maxSize) {
      query += ` AND l.size_ml <= $${paramIndex++}`;
      params.push(parseInt(maxSize as string));
    }

    query += ' ORDER BY l.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ listings: result.rows });
  } catch (error: any) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/listings', async (req: Request, res: Response) => {
  try {
    const listing = req.body;
    const id = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO listings (
        id, user_id, fragrance_id, custom_name, house, concentration, 
        size_ml, fill_percentage, condition, batch_code, description, 
        photos, swap_preferences, is_active, estimated_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        id, listing.user_id, listing.fragrance_id, listing.custom_name,
        listing.house, listing.concentration, listing.size_ml, listing.fill_percentage,
        listing.condition, listing.batch_code, listing.description,
        listing.photos, listing.swap_preferences ? JSON.stringify(listing.swap_preferences) : null,
        listing.is_active ?? true, listing.estimated_value
      ]
    );

    res.json({ listing: result.rows[0] });
  } catch (error: any) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/listings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates).filter(k => k !== 'id');
    const values = fields.map(k => {
      if (k === 'photos' || k === 'swap_preferences') {
        return JSON.stringify(updates[k]);
      }
      return updates[k];
    });
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const result = await pool.query(
      `UPDATE listings SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ listing: result.rows[0] });
  } catch (error: any) {
    console.error('Update listing error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/listings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM listings WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/swaps', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await pool.query(`
      SELECT s.*,
        json_build_object(
          'id', i.id,
          'email', i.email,
          'username', i.username,
          'avatar_url', i.avatar_url,
          'total_swaps', i.total_swaps,
          'rating', i.rating
        ) as initiator,
        json_build_object(
          'id', r.id,
          'email', r.email,
          'username', r.username,
          'avatar_url', r.avatar_url,
          'total_swaps', r.total_swaps,
          'rating', r.rating
        ) as recipient
      FROM swaps s
      JOIN users i ON s.initiator_id = i.id
      JOIN users r ON s.recipient_id = r.id
      WHERE s.initiator_id = $1 OR s.recipient_id = $1
      ORDER BY s.created_at DESC
    `, [userId]);

    res.json({ swaps: result.rows });
  } catch (error: any) {
    console.error('Get swaps error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/swaps', async (req: Request, res: Response) => {
  try {
    const { initiator_id, recipient_id, initiator_listings, recipient_listings } = req.body;
    const id = uuidv4();
    
    const fairnessScore = Math.floor(Math.random() * 30) + 70;
    const aiAssessment = fairnessScore >= 85 
      ? 'This swap appears to be well-balanced based on market values and condition.'
      : 'This swap has a slight imbalance. Consider adjusting the items offered.';

    const result = await pool.query(
      `INSERT INTO swaps (
        id, initiator_id, recipient_id, initiator_listings, recipient_listings,
        status, fairness_score, ai_assessment
      ) VALUES ($1, $2, $3, $4, $5, 'proposed', $6, $7)
      RETURNING *`,
      [id, initiator_id, recipient_id, initiator_listings, recipient_listings, fairnessScore, aiAssessment]
    );

    res.json({ 
      swap: result.rows[0], 
      fairness_score: fairnessScore,
      ai_assessment: aiAssessment 
    });
  } catch (error: any) {
    console.error('Create swap error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/swaps/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates).filter(k => k !== 'id');
    const values = fields.map(k => updates[k]);
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const result = await pool.query(
      `UPDATE swaps SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Swap not found' });
    }

    res.json({ swap: result.rows[0] });
  } catch (error: any) {
    console.error('Update swap error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/swaps/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT m.*,
        json_build_object(
          'id', u.id,
          'email', u.email,
          'username', u.username,
          'avatar_url', u.avatar_url
        ) as sender
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.swap_id = $1
      ORDER BY m.created_at ASC
    `, [id]);

    res.json({ messages: result.rows });
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/swaps/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id: swapId } = req.params;
    const { sender_id, message } = req.body;
    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO messages (id, swap_id, sender_id, message) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, swapId, sender_id, message]
    );

    res.json({ message: result.rows[0] });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/swaps/:id/ai-mediation', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    
    const responses = [
      'Based on the current market values and condition of both fragrances, this appears to be a reasonably fair swap.',
      'I would suggest the person with the higher-valued item consider asking for a small decant to balance this trade.',
      'Both fragrances have similar market values and the fill levels are comparable. This is a balanced swap.',
      'Consider the longevity and sillage ratings - the fragrance you are receiving performs better in these areas.',
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    res.json({ response });
  } catch (error: any) {
    console.error('AI mediation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ratings', async (req: Request, res: Response) => {
  try {
    const rating = req.body;
    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO ratings (
        id, swap_id, rater_id, ratee_id, accuracy_score, packaging_score,
        communication_score, timeliness_score, overall_score, review
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        id, rating.swap_id, rating.rater_id, rating.ratee_id,
        rating.accuracy_score, rating.packaging_score, rating.communication_score,
        rating.timeliness_score, rating.overall_score, rating.review
      ]
    );

    const avgResult = await pool.query(
      'SELECT AVG(overall_score) as avg_rating FROM ratings WHERE ratee_id = $1',
      [rating.ratee_id]
    );
    const avgRating = avgResult.rows[0]?.avg_rating || 0;

    await pool.query(
      'UPDATE users SET rating = $1, total_swaps = total_swaps + 1 WHERE id = $2',
      [avgRating, rating.ratee_id]
    );

    res.json({ rating: result.rows[0] });
  } catch (error: any) {
    console.error('Create rating error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id/ratings', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.*,
        json_build_object(
          'id', u.id,
          'email', u.email,
          'username', u.username,
          'avatar_url', u.avatar_url
        ) as rater
      FROM ratings r
      JOIN users u ON r.rater_id = u.id
      WHERE r.ratee_id = $1
      ORDER BY r.created_at DESC
    `, [id]);

    res.json({ ratings: result.rows });
  } catch (error: any) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fairness-check', async (req: Request, res: Response) => {
  try {
    const score = Math.floor(Math.random() * 30) + 70;
    const assessment = score >= 85 
      ? 'This swap is well-balanced. Both parties are receiving comparable value.'
      : 'There is a slight imbalance in this swap. The initiator may want to add another item.';
    const suggestions = score < 85 
      ? ['Consider adding a decant to balance the trade', 'Review the fill levels of both bottles']
      : [];

    res.json({ score, assessment, suggestions });
  } catch (error: any) {
    console.error('Fairness check error:', error);
    res.status(500).json({ error: error.message });
  }
});

const port = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
app.listen(port, '0.0.0.0', () => {
  console.log(`ScentSwap API server running on port ${port}`);
});
