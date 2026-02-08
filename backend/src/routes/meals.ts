import express, {Request, Response} from 'express';
import {MealService} from '../services/meal.service';

const router = express.Router();
const mealService = new MealService();

// POST /api/v1/meals/analyze
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const {photoDataUri, remainingCalories, remainingDishes} = req.body;

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
      remainingCalories,
      ...(remainingDishes !== undefined && { remainingDishes })
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

// POST /api/v1/meals/reanalyze
router.post('/reanalyze', async (req: Request, res: Response) => {
  try {
    const {photoDataUri, customFoodName, remainingCalories, remainingDishes} = req.body;

    // バリデーション
    if (!photoDataUri || typeof photoDataUri !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'photoDataUri is required and must be a string'
      });
    }

    if (!customFoodName || typeof customFoodName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'customFoodName is required and must be a string'
      });
    }

    // プロンプトインジェクション対策: 文字数制限とサニタイズ
    const sanitizedFoodName = customFoodName.trim();
    if (sanitizedFoodName.length === 0 || sanitizedFoodName.length > 15) {
      return res.status(400).json({
        success: false,
        error: 'customFoodName must be between 1 and 15 characters'
      });
    }

    if (remainingCalories === undefined || typeof remainingCalories !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'remainingCalories is required and must be a number'
      });
    }

    // AI再分析実行
    const result = await mealService.reanalyzeMeal({
      photoDataUri,
      customFoodName: sanitizedFoodName,
      remainingCalories,
      ...(remainingDishes !== undefined && { remainingDishes })
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /reanalyze endpoint:', error);
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
