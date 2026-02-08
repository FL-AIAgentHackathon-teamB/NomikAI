"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { analyzeMeal, reanalyzeMeal as reanalyzeMealAction } from "@/app/actions";
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
  PartyPopper,
  Pencil,
  Check,
  ChevronDown,
  ChevronUp
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
  meals: Meal[];
}

const SessionHeader = ({ session, meals }: SessionHeaderProps) => {
  const [displayedCalories, setDisplayedCalories] = useState(session.remainingCalories);
  const [displayedProgress, setDisplayedProgress] = useState((session.remainingCalories / session.targetCalories) * 100);
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = (session.remainingCalories / session.targetCalories) * 100;
  const isOverCalories = session.remainingCalories < 0;
  const overAmount = Math.abs(session.remainingCalories);
  
  // 残りカロリーの割合に応じて色を変更
  const getColorClasses = () => {
    if (isOverCalories) {
      return {
        text: 'text-red-500',
        icon: 'text-red-500',
        progress: 'bg-red-500'
      };
    } else if (progress < 40) {
      return {
        text: 'text-yellow-500',
        icon: 'text-yellow-500',
        progress: 'bg-yellow-500'
      };
    } else {
      return {
        text: 'text-primary',
        icon: 'text-primary',
        progress: 'bg-primary'
      };
    }
  };
  
  const colorClasses = getColorClasses();

  // カロリーが変わったらアニメーション
  useEffect(() => {
    const startValue = displayedCalories;
    const endValue = session.remainingCalories;
    const startProgress = displayedProgress;
    const endProgress = (session.remainingCalories / session.targetCalories) * 100;
    const duration = 1000; // 1秒に統一
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // イージング関数（ease-out）
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentCalories = startValue + (endValue - startValue) * eased;
      const currentProgress = startProgress + (endProgress - startProgress) * eased;

      setDisplayedCalories(Math.round(currentCalories));
      setDisplayedProgress(currentProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [session.remainingCalories, session.targetCalories]);

  return (
    <>
      {/* 背景オーバーレイ（Portal化） */}
      {isExpanded && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsExpanded(false)}
        />,
        document.body
      )}

      <div className="sticky top-4 z-[60] relative">
        <Card className="w-full bg-card">
        <CardContent
          className="py-3 px-4 cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between gap-4">
            {/* 残りカロリー表示（コンパクト） */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Flame className={`h-4 w-4 flex-shrink-0 ${colorClasses.icon}`} />
              <div className="min-w-0 flex-1">
                {isOverCalories ? (
                  <div className="flex items-baseline gap-1 whitespace-nowrap">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 translate-y-0.5 translate-x-0.5" />
                    <span className="text-sm font-bold text-red-500">
                      {Math.abs(displayedCalories)} kcal
                    </span>
                    <span className="text-[10px] font-extrabold text-red-500">
                      Over
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1 whitespace-nowrap">
                    <span className={`text-base font-bold ${colorClasses.text}`}>
                      残り {displayedCalories}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {session.targetCalories} kcal
                    </span>
                  </div>
                )}
                <div className="relative h-1.5 mt-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${colorClasses.progress} rounded-full`}
                    style={{ width: `${Math.min(displayedProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 残りの品数（あれば） */}
              {session.remainingDishes !== undefined && (
                <Badge variant="secondary">
                  <UtensilsCrossed className="h-3 w-3 mr-1" />
                  {session.remainingDishes > 0 ? (
                    <>残り {session.remainingDishes} 品</>
                  ) : session.remainingDishes === 0 ? (
                    <>残り 0 品</>
                  ) : (
                    <>おかわり +{Math.abs(session.remainingDishes)} 品</>
                  )}
                </Badge>
              )}

              {/* 開閉アイコン */}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 履歴ドロワー（absolute配置） */}
      <div
        className={`absolute top-full left-0 right-0 mt-2 bg-card rounded-lg shadow-lg overflow-hidden transition-all ease-in-out z-[60] ${
          isExpanded && meals.length > 0 ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{
          transitionDuration: isExpanded ? `${meals.length * 150}ms` : '200ms'
        }}
      >
        <div className="px-4 py-3 border-b bg-card">
          <h3 className="text-sm font-semibold">食事履歴</h3>
        </div>
        <div className="px-4 py-3 max-h-[520px] overflow-y-auto">
          {meals.length > 0 ? (
            <div className="space-y-2">
              {meals.map((meal, index) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/50"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-semibold text-muted-foreground flex-shrink-0">
                      {index + 1}品目
                    </span>
                    <span className="text-sm font-semibold truncate">
                      {meal.foodName}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-primary flex-shrink-0 ml-2">
                    {meal.actualCalories} kcal
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              まだ食事の記録がありません
            </p>
          )}
        </div>
      </div>
    </div>
    </>
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
  onReanalyze: (mealId: string, newName: string) => Promise<void>;
}

const MealCard = ({ meal, onSelectConsumption, onReanalyze }: MealCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(meal.foodName);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const { toast } = useToast();

  // mealが更新されたらeditedNameも更新
  useEffect(() => {
    setEditedName(meal.foodName);
  }, [meal.foodName]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedName(meal.foodName);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(meal.foodName);
  };

  const handleSave = async () => {
    if (!editedName.trim()) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "メニュー名を入力してください",
      });
      return;
    }
    
    setIsReanalyzing(true);
    setIsEditing(false);
    try {
      await onReanalyze(meal.id, editedName.trim());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "再分析に失敗しました",
      });
      setIsEditing(true);
    } finally {
      setIsReanalyzing(false);
    }
  };

  return (
    <Card className="w-full mb-4 overflow-hidden">
      <div className="relative w-full aspect-video">
        <Image src={meal.imageUrl} alt={meal.foodName} fill className="object-cover" />
      </div>
      
      {isReanalyzing ? (
        <CardContent className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">分析し直しています...</p>
        </CardContent>
      ) : (
        <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="flex-1 text-lg font-bold min-w-0"
                  disabled={isReanalyzing}
                  autoFocus
                  maxLength={15}
                  placeholder="メニュー名（15文字以内）"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={isReanalyzing}
                  className="h-8 w-8 hover:bg-transparent flex-shrink-0"
                >
                  {isReanalyzing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5 stroke-[3] text-green-600" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isReanalyzing}
                  className="h-8 w-8 hover:bg-transparent flex-shrink-0"
                >
                  <X className="h-5 w-5 stroke-[3] text-red-600" />
                </Button>
              </div>
            ) : (
              <>
                <p className="font-bold text-foreground text-lg truncate">{meal.foodName}</p>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleEdit}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-accent/10 p-2 rounded-full">
            <Flame className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-lg text-muted-foreground">
              約 <span className="font-bold text-foreground">{meal.calorieEstimate}</span> kcal
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          {meal.verdict && (
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <Badge
                variant={meal.verdict === 'OK' ? 'default' : 'destructive'}
                className="text-base font-semibold px-4 py-1"
              >
                {meal.verdict === 'OK' ? (
                  <CheckCircle2 className="h-5 w-5 mr-1" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mr-1" />
                )}
                <span>{meal.verdict === 'OK' ? '食べてOK！' : 'ちょっと注意！'}</span>
              </Badge>
            </div>
          )}
          <p className="text-muted-foreground ml-14">{meal.suggestedRefinement}</p>
        </div>

        {meal.actualCalories !== undefined && meal.consumptionLevel && (
          <div className="pt-4 border-t">
            <p className="text-base font-semibold text-green-600">
              実際の摂取: {meal.actualCalories} kcal
              <span className="text-sm ml-2 text-muted-foreground">
                ({meal.consumptionLevel === 'suggested' ? '提案通り' : 
                  meal.consumptionLevel === 'more' ? 'もっと食べる' : 
                  '少しだけ'})
              </span>
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
      )}
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [preAnalyzedResult, setPreAnalyzedResult] = useState<AnalyzeMealAndSuggestRefinementOutput | null>(null);
  const [isPreAnalyzing, setIsPreAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 残り品数が0の場合は自動的に折りたたむ
  useEffect(() => {
    if (remainingDishes !== undefined && remainingDishes <= 0) {
      setIsExpanded(false);
      // 画像プレビューもリセット
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [remainingDishes]);

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
        // 残り品数が0以下の場合は再び折りたたむ
        if (remainingDishes !== undefined && remainingDishes - 1 <= 0) {
          setIsExpanded(false);
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

  // 残り品数が0の場合は「もっと食べる」ボタンを表示
  if (remainingDishes !== undefined && remainingDishes <= 0 && !isExpanded) {
    return (
      <Card className="w-full">
        <CardContent className="py-6">
          <Button 
            onClick={() => setIsExpanded(true)}
            className="w-full"
            variant="outline"
          >
            <UtensilsCrossed className="mr-2 h-4 w-4" />
            もっと食べる
          </Button>
        </CardContent>
      </Card>
    );
  }

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
            disabled={isAnalyzing}
          />
          <Label
            htmlFor="new-meal-photo"
            className={`flex items-center justify-center w-full border border-solid border-input bg-background rounded-md h-32 flex-col gap-2 text-muted-foreground ${
              !isAnalyzing && 'cursor-pointer'
            }`}
          >
            {imagePreview ? (
              <div className="relative w-full h-full">
                <Image src={imagePreview} alt="新しいメニュー" fill className="object-cover rounded-md" />
                {!isAnalyzing && (
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
                )}
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
  onReanalyze: (mealId: string, newName: string) => Promise<void>;
  onEndSession: () => void;
}

const SessionView = ({ 
  session, 
  meals, 
  onAddMeal, 
  onSelectConsumption,
  onReanalyze,
  onEndSession 
}: SessionViewProps) => {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <SessionHeader session={session} meals={meals} />
      
      <div className="space-y-4">
        {meals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onSelectConsumption={(level) => onSelectConsumption(meal.id, level)}
            onReanalyze={onReanalyze}
          />
        ))}
      </div>

      <NewMealInput
        key={meals.length}
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
      remainingDishes: session.remainingDishes !== undefined ? session.remainingDishes - 1 : undefined,
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

  const reanalyzeMealFunc = async (mealId: string, newName: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (!meal || !session) return;

    // 新しい名前で再分析（再分析用の専用エンドポイント）
    const result = await reanalyzeMealAction({
      photoDataUri: meal.imageUrl,
      customFoodName: newName,
      remainingCalories: session.remainingCalories,
      ...(session.remainingDishes !== undefined && { remainingDishes: session.remainingDishes }),
    });

    if (result.success && result.data) {
      // 既に消費量を選択済みの場合は、一旦カロリーを戻す
      let adjustedRemainingCalories = session.remainingCalories;
      if (meal.actualCalories !== undefined) {
        adjustedRemainingCalories += meal.actualCalories;
      }

      // メニュー情報を更新（消費量選択はリセット）
      const updatedMeals = meals.map(m =>
        m.id === mealId ? {
          ...m,
          foodName: result.data.foodName,
          calorieEstimate: result.data.calorieEstimate,
          suggestedRefinement: result.data.suggestedRefinement,
          verdict: result.data.verdict,
          consumptionLevel: undefined,
          actualCalories: undefined,
        } : m
      );
      setMeals(updatedMeals);
      localStorage.setItem('sessionMeals', JSON.stringify(updatedMeals));

      // セッション更新
      const updatedSession: Session = {
        ...session,
        remainingCalories: adjustedRemainingCalories,
      };
      setSession(updatedSession);
      localStorage.setItem('currentSession', JSON.stringify(updatedSession));
    } else {
      throw new Error(result.error || '再分析に失敗しました');
    }
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
      onReanalyze={reanalyzeMealFunc}
      onEndSession={endSession}
    />
  );
}
