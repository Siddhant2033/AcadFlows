import { Router } from 'express';
import { User } from '../../models/User';

const router: ReturnType<typeof Router> = Router();

router.get('/admin-exists/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const admin = await User.findOne({ 
      tenantId, 
      role: 'admin',
      status: 'active' 
    });
    
    res.json({
      success: true,
      data: { exists: !!admin }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check admin existence'
    });
  }
});

export default router;