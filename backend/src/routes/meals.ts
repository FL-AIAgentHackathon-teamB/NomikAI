import express, {Request, Response} from 'express';
import {MealService} from '../services/meal.service';

const router = express.Router();
const mealService = new MealService();

// POST /api/v1/meals/analyze
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const {photoDataUri, remainingCalories} = req.body;

    // バリデーション
    if (!photoDataUri || typeof photoDataUri !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'photoDataUri is required and must be a string'
      });
    }

    if (remainingCalories === undefined || typeof remainingCalories !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'remainingCalories is required and must be a number'
      });
    }

    // AI分析実行
    const result = await mealService.analyzeMeal({
      photoDataUri,
      remainingCalories
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /analyze endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ヘルスチェック
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({status: 'ok', service: 'meal-analyzer'});
});

export default router;
