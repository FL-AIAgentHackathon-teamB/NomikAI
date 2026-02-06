"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import Image from "next/image";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { analyzeMeal } from "@/app/actions";
import type { AnalyzeMealAndSuggestRefinementOutput } from "@/ai/flows/analyze-meal-and-suggest-refinement";
import { 
  Loader2, 
  UtensilsCrossed, 
  Flame, 
  Sparkles, 
  Image as ImageIcon, 
  RotateCw, 
  X, 
  AlertTriangle, 
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  PartyPopper
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ==================== 型定義 ====================

type ConsumptionLevel = 'suggested' | 'more' | 'less';

interface Session {
  id: string;
  targetCalories: number;
  remainingCalories: number;
  totalDishes?: number;
  remainingDishes?: number;
  startedAt: Date;
  status: 'active' | 'completed';
}

interface Meal {
  id: string;
  imageUrl: string;
  analyzedAt: Date;
  foodName: string;
  calorieEstimate: number;
  suggestedRefinement: string;
  verdict: 'OK' | 'CAUTION';
  consumptionLevel?: ConsumptionLevel;
  actualCalories?: number;
}

// ==================== ユーティリティ関数 ====================

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const calculateActualCalories = (estimate: number, level: ConsumptionLevel): number => {
  switch (level) {
    case 'suggested':
      return Math.round(estimate * 0.7);
    case 'more':
      return estimate;
    case 'less':
      return Math.round(estimate * 0.3);
  }
};

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = document.createElement('img');
    
    reader.onload = (e) => {
      img.src = e.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context が取得できませんでした'));
          return;
        }
        
        const MAX_SIZE = 1024;
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = (height * MAX_SIZE) / width;
            width = MAX_SIZE;
          } else {
            width = (width * MAX_SIZE) / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        let compressedDataUri = canvas.toDataURL('image/jpeg', 0.7);
        const sizeInMB = (compressedDataUri.length * 0.75) / (1024 * 1024);
        
        if (sizeInMB > 5) {
          compressedDataUri = canvas.toDataURL('image/jpeg', 0.5);
        }
        
        resolve(compressedDataUri);
      };
      
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// ==================== SessionInitForm ====================

const initFormSchema = z.object({
  targetCalories: z.coerce.number().int().positive(),
  totalDishes: z.coerce.number().int().positive().optional().or(z.literal('')),
});

type InitFormValues = z.infer<typeof initFormSchema>;

interface SessionInitFormProps {
  onStart: (targetCalories: number, totalDishes?: number) => void;
}

const SessionInitForm = ({ onStart }: SessionInitFormProps) => {
  const form = useForm<InitFormValues>({
    resolver: zodResolver(initFormSchema),
    mode: "onChange",
  });

  const handleSubmit: SubmitHandler<InitFormValues> = (data) => {
    onStart(
      data.targetCalories,
      typeof data.totalDishes === 'number' ? data.totalDishes : undefined
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <PartyPopper className="h-6 w-6" />
          飲み会をスタート！
        </CardTitle>
        <CardDescription>
          目標カロリーと品数を入力してセッションを開始しましょう
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="targetCalories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>本日の目標（上限）カロリー</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例: 2000"
                      className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalDishes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>予定されている品数（任意）</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例: 5（コース料理で5品来る場合）"
                      className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? '' : e.target.valueAsNumber)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={!form.formState.isValid}>
              <PartyPopper className="mr-2 h-4 w-4" />
              飲み会スタート！
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

// ==================== SessionHeader ====================

interface SessionHeaderProps {
  session: Session;
}

const SessionHeader = ({ session }: SessionHeaderProps) => {
  const progress = (session.remainingCalories / session.targetCalories) * 100;
  const consumedCalories = session.targetCalories - session.remainingCalories;
  
  const progressColor = progress > 50 ? 'bg-green-500' : progress > 20 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <Card className="w-full mb-6">
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">残りカロリー</span>
            <span className="text-lg font-bold">
              {session.remainingCalories} / {session.targetCalories} kcal
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground text-right">
            消費: {consumedCalories} kcal
          </p>
        </div>
        
        {session.remainingDishes !== undefined && (
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm font-semibold">残りの品数</span>
            <Badge variant="outline" className="text-base">
              あと {session.remainingDishes} 品
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== ConsumptionSelector ====================

interface ConsumptionSelectorProps {
  onSelect: (level: ConsumptionLevel) => void;
  selected?: ConsumptionLevel;
  estimate: number;
}

const ConsumptionSelector = ({ onSelect, selected, estimate }: ConsumptionSelectorProps) => {
  const options: { level: ConsumptionLevel; label: string; icon: any; calories: number }[] = [
    { 
      level: 'suggested', 
      label: '提案通り', 
      icon: CheckCircle2,
      calories: Math.round(estimate * 0.7)
    },
    { 
      level: 'more', 
      label: 'もっと食べる', 
      icon: ArrowUp,
      calories: estimate
    },
    { 
      level: 'less', 
      label: '少しだけ', 
      icon: ArrowDown,
      calories: Math.round(estimate * 0.3)
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">どれくらい食べましたか？</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map(({ level, label, icon: Icon, calories }) => (
          <Button
            key={level}
            variant={selected === level ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(level)}
            disabled={selected !== undefined}
            className="flex flex-col h-auto py-3 gap-1"
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs">{label}</span>
            <span className="text-xs font-bold">{calories}kcal</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

// ==================== MealCard ====================

interface MealCardProps {
  meal: Meal;
  onSelectConsumption: (level: ConsumptionLevel) => void;
}

const MealCard = ({ meal, onSelectConsumption }: MealCardProps) => {
  return (
    <Card className="w-full mb-4 overflow-hidden">
      <div className="relative w-full aspect-video">
        <Image src={meal.imageUrl} alt={meal.foodName} fill className="object-cover" />
      </div>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-foreground text-lg">{meal.foodName}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="bg-accent/10 p-2 rounded-full">
            <Flame className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold">推定カロリー</h3>
            <p className="text-muted-foreground">
              約 <span className="font-bold text-foreground">{meal.calorieEstimate}</span> カロリー
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">提案</h3>
            {meal.verdict && (
              <Badge
                variant={meal.verdict === 'OK' ? 'default' : 'destructive'}
                className="text-base font-semibold px-4 py-1 my-2"
              >
                {meal.verdict === 'OK' ? (
                  <CheckCircle2 className="h-5 w-5 mr-1" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mr-1" />
                )}
                <span>{meal.verdict === 'OK' ? '食べてOK！' : 'ちょっと注意！'}</span>
              </Badge>
            )}
            <p className="text-muted-foreground">{meal.suggestedRefinement}</p>
          </div>
        </div>

        {meal.actualCalories !== undefined && (
          <div className="pt-4 border-t">
            <p className="text-sm font-semibold text-green-600">
              実際の摂取: {meal.actualCalories} kcal
            </p>
          </div>
        )}

        {meal.consumptionLevel === undefined && (
          <ConsumptionSelector
            estimate={meal.calorieEstimate}
            onSelect={onSelectConsumption}
            selected={meal.consumptionLevel}
          />
        )}
      </CardContent>
    </Card>
  );
};

// ==================== NewMealInput ====================

interface NewMealInputProps {
  remainingCalories: number;
  remainingDishes?: number;
  onAnalyze: (result: AnalyzeMealAndSuggestRefinementOutput, imageUrl: string) => void;
}

const NewMealInput = ({ remainingCalories, remainingDishes, onAnalyze }: NewMealInputProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    setIsAnalyzing(true);
    try {
      const photoDataUri = await fileToDataUri(fileInputRef.current.files[0]);
      const result = await analyzeMeal({
        photoDataUri,
        remainingCalories,
        ...(remainingDishes && { remainingDishes }),
      });

      if (result.success && result.data) {
        onAnalyze(result.data, photoDataUri);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast({
          variant: "destructive",
          title: "分析失敗",
          description: result.error || "不明なエラーが発生しました。",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "問題が発生しました。もう一度お試しください。",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">新しいメニューを追加</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            id="new-meal-photo"
          />
          <Label
            htmlFor="new-meal-photo"
            className="cursor-pointer flex items-center justify-center w-full border border-solid border-input bg-background rounded-md h-32 flex-col gap-2 text-muted-foreground"
          >
            {imagePreview ? (
              <div className="relative w-full h-full">
                <Image src={imagePreview} alt="新しいメニュー" fill className="object-cover rounded-md" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full z-10 bg-black/50 text-white hover:bg-black/70"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeImage();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <ImageIcon className="h-8 w-8"/>
                <span>写真をアップロード</span>
              </>
            )}
          </Label>
        </div>
        <Button 
          onClick={handleAnalyze} 
          disabled={!imagePreview || isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              分析中...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              分析する
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

// ==================== SessionView ====================

interface SessionViewProps {
  session: Session;
  meals: Meal[];
  onAddMeal: (result: AnalyzeMealAndSuggestRefinementOutput, imageUrl: string) => void;
  onSelectConsumption: (mealId: string, level: ConsumptionLevel) => void;
  onEndSession: () => void;
}

const SessionView = ({ 
  session, 
  meals, 
  onAddMeal, 
  onSelectConsumption,
  onEndSession 
}: SessionViewProps) => {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <SessionHeader session={session} />
      
      <div className="space-y-4">
        {meals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onSelectConsumption={(level) => onSelectConsumption(meal.id, level)}
          />
        ))}
      </div>

      <NewMealInput
        remainingCalories={session.remainingCalories}
        remainingDishes={session.remainingDishes}
        onAnalyze={onAddMeal}
      />

      <Button 
        variant="outline" 
        className="w-full" 
        onClick={onEndSession}
      >
        セッションを終了
      </Button>
    </div>
  );
};

// ==================== MealAnalyzer (Main) ====================

export function MealAnalyzer() {
  const [session, setSession] = useState<Session | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);

  // localStorage から復元
  useEffect(() => {
    const savedSession = localStorage.getItem('currentSession');
    const savedMeals = localStorage.getItem('sessionMeals');
    
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      // Date型に変換
      parsed.startedAt = new Date(parsed.startedAt);
      setSession(parsed);
    }
    if (savedMeals) {
      const parsed = JSON.parse(savedMeals);
      // Date型に変換
      parsed.forEach((meal: Meal) => {
        meal.analyzedAt = new Date(meal.analyzedAt);
      });
      setMeals(parsed);
    }
  }, []);

  const startSession = (targetCalories: number, totalDishes?: number) => {
    const newSession: Session = {
      id: generateId(),
      targetCalories,
      remainingCalories: targetCalories,
      totalDishes,
      remainingDishes: totalDishes,
      startedAt: new Date(),
      status: 'active',
    };
    setSession(newSession);
    localStorage.setItem('currentSession', JSON.stringify(newSession));
  };

  const addMeal = (result: AnalyzeMealAndSuggestRefinementOutput, imageUrl: string) => {
    if (!session) return;

    const newMeal: Meal = {
      id: generateId(),
      imageUrl,
      analyzedAt: new Date(),
      foodName: result.foodName,
      calorieEstimate: result.calorieEstimate,
      suggestedRefinement: result.suggestedRefinement,
      verdict: result.verdict,
    };
    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals);
    localStorage.setItem('sessionMeals', JSON.stringify(updatedMeals));

    // メニューを追加した時点で品数を減らす
    const updatedSession: Session = {
      ...session,
      remainingDishes: session.remainingDishes ? session.remainingDishes - 1 : undefined,
    };
    setSession(updatedSession);
    localStorage.setItem('currentSession', JSON.stringify(updatedSession));
  };

  const selectConsumption = (mealId: string, level: ConsumptionLevel) => {
    const meal = meals.find(m => m.id === mealId);
    if (!meal || !session) return;

    const actualCalories = calculateActualCalories(meal.calorieEstimate, level);
    
    // メニュー更新
    const updatedMeals = meals.map(m =>
      m.id === mealId ? { ...m, consumptionLevel: level, actualCalories } : m
    );
    setMeals(updatedMeals);
    localStorage.setItem('sessionMeals', JSON.stringify(updatedMeals));

    // セッション更新（カロリーのみ更新、品数は addMeal で既に減らしている）
    const updatedSession: Session = {
      ...session,
      remainingCalories: session.remainingCalories - actualCalories,
    };
    setSession(updatedSession);
    localStorage.setItem('currentSession', JSON.stringify(updatedSession));
  };

  const endSession = () => {
    setSession(null);
    setMeals([]);
    localStorage.removeItem('currentSession');
    localStorage.removeItem('sessionMeals');
  };

  // セッションがない場合は初期設定フォームを表示
  if (!session) {
    return <SessionInitForm onStart={startSession} />;
  }

  // セッションがある場合はセッション画面を表示
  return (
    <SessionView
      session={session}
      meals={meals}
      onAddMeal={addMeal}
      onSelectConsumption={selectConsumption}
      onEndSession={endSession}
    />
  );
}
