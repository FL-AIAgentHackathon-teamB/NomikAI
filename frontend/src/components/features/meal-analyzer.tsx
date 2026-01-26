
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
import { Loader2, UtensilsCrossed, Flame, Sparkles, Image as ImageIcon, RotateCw, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Form schema
const formSchema = z.object({
  remainingCalories: z.coerce
    .number()
    .int()
    .positive(),
  photo: z.any().refine((files) => files?.[0]),
});

type FormValues = z.infer<typeof formSchema>;

const initialLoadingTip = "AIエージェントがカロリーを推定し、アドバイスを準備しています。しばらくお待ちください。";
const loadingTips = [
  initialLoadingTip,
  "💡 飲み会前の牛乳は胃の粘膜を保護しますよ",
  "💡 枝豆はアルコールの分解を助ける最強のおつまみです",
  "💡 お酒と同量の「お水」を飲むのが二日酔い防止のコツです",
  "💡 締めのラーメンの代わりに「味噌汁」はどうですか？",
  "💡 焼き鳥は「タレ」より「塩」が低カロリーです",
  "💡 食べる順番を「野菜→肉→米」にすると太りにくいですよ",
  "💡 揚げ物の衣を少し残すとカロリーオフできます",
  "🤖 今、画像から全力でカロリーを計算しています...",
  "🤖 どんな結果でも怒らないでくださいね、リカバリー案も考えます",
  "💪 今日食べ過ぎても、明日調整すれば大丈夫です！",
];

// Result component
const AnalysisResult = ({
  result,
  onReset,
  imagePreview
}: {
  result: AnalyzeMealAndSuggestRefinementOutput;
  onReset: () => void;
  imagePreview: string;
}) => (
  <Card className="w-full max-w-md animate-in fade-in duration-500 overflow-hidden">
    <div className="relative w-full aspect-video">
      <Image src={imagePreview} alt="分析された食事" fill className="object-cover" />
    </div>
    <CardContent className="space-y-6 pt-6">
       <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-2 rounded-full">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-foreground text-lg">{result.foodName}</p>
        </div>
       </div>
      <div className="flex items-start gap-4">
        <div className="bg-accent/10 p-2 rounded-full">
          <Flame className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold">推定カロリー</h3>
          <p className="text-muted-foreground">
            約 <span className="font-bold text-foreground">{result.calorieEstimate}</span> カロリー
          </p>
        </div>
      </div>
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-2 rounded-full">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">提案</h3>
          {result.verdict && (
              <Badge
                  variant={result.verdict === 'OK' ? 'default' : 'destructive'}
                  className="text-base font-semibold px-4 py-1 my-2"
              >
                  {result.verdict === 'OK' ? (
                      <CheckCircle2 className="h-5 w-5" />
                  ) : (
                      <AlertTriangle className="h-5 w-5" />
                  )}
                  <span>{result.verdict === 'OK' ? '食べてOK！' : 'ちょっと注意！'}</span>
              </Badge>
          )}
          <p className="text-muted-foreground">{result.suggestedRefinement}</p>
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <Button onClick={onReset} className="w-full">
        <RotateCw className="mr-2 h-4 w-4" />
        別の食事を分析する
      </Button>
    </CardFooter>
  </Card>
);

// Main component
export function MealAnalyzer() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeMealAndSuggestRefinementOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [currentTip, setCurrentTip] = useState(initialLoadingTip);
  const [isTipVisible, setIsTipVisible] = useState(true);

  useEffect(() => {
    let tipInterval: NodeJS.Timeout | undefined;
    let visibilityTimeout: NodeJS.Timeout | undefined;

    if (isLoading) {
      setCurrentTip(initialLoadingTip);
      setIsTipVisible(true);

      tipInterval = setInterval(() => {
        setIsTipVisible(false); // Start fade-out

        visibilityTimeout = setTimeout(() => {
          setCurrentTip(prevTip => {
            let newTip = prevTip;
            while (newTip === prevTip) {
              newTip = loadingTips[Math.floor(Math.random() * loadingTips.length)];
            }
            return newTip;
          });
          setIsTipVisible(true); // Start fade-in
        }, 300);
      }, 2500);
    }

    return () => {
      clearInterval(tipInterval);
      clearTimeout(visibilityTimeout);
    };
  }, [isLoading]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("photo", [file], { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setCurrentTip(initialLoadingTip);

    try {
      const photoDataUri = await fileToDataUri(data.photo[0]);
      const result = await analyzeMeal({
        remainingCalories: data.remainingCalories,
        photoDataUri,
      });

      if (result.success && result.data) {
        setAnalysisResult(result.data);
      } else {
        toast({
          variant: "destructive",
          title: "分析失敗",
          description: result.error || "不明なエラーが発生しました。",
        });
        setIsLoading(false);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "問題が発生しました。もう一度お試しください。",
      });
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setImagePreview(null);
    setAnalysisResult(null);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue("photo", undefined, { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading && !analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-semibold text-muted-foreground font-headline">食事を分析中...</p>
        <div className="h-16 flex items-center justify-center">
          <p className={`text-sm text-muted-foreground max-w-xs transition-opacity duration-300 ${isTipVisible ? 'opacity-100' : 'opacity-0'}`}>{currentTip}</p>
        </div>
      </div>
    );
  }

  if (analysisResult && imagePreview) {
    return <AnalysisResult result={analysisResult} onReset={resetForm} imagePreview={imagePreview} />;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">食事を分析する</CardTitle>
        <CardDescription>
          残りのカロリーを入力し、食事の写真をアップロードしてください。
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="remainingCalories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>本日の目標（上限）カロリー</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例: 1200"
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
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>食事の写真</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          className="hidden"
                          id="photo-upload"
                        />
                        <Label
                          htmlFor="photo-upload"
                          className="cursor-pointer flex items-center justify-center w-full border border-solid border-input bg-background rounded-md h-32 flex-col gap-2 text-muted-foreground"
                        >
                        {imagePreview ? (
                          <div className="relative w-full h-full">
                            <Image src={imagePreview} alt="食事のプレビュー" fill className="object-cover rounded-md" />
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
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={!form.formState.isValid || isLoading}>
              <Sparkles className="mr-2 h-4 w-4" />
              AIに相談する
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
