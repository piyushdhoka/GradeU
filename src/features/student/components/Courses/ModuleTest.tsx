import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Progress } from '@shared/components/ui/progress';
import { cn } from '@lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@shared/components/ui/alert';

interface ModuleTestProps {
  moduleId: string;
  moduleTitle: string;
  onComplete: (score: number, answers: number[]) => void;
  onBack: () => void;
  questions?: {
    question: string;
    options: string[];
    correctAnswer: number | string;
    explanation?: string;
  }[];
  isInitialAssessment?: boolean;
}

export const ModuleTest: React.FC<ModuleTestProps> = ({
  moduleId,
  moduleTitle,
  onComplete,
  onBack,
  questions = [],
  isInitialAssessment = false,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes

  const currentQuestion = questions[currentQuestionIndex];

  React.useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmitTest();
    }
  }, [timeLeft, showResults]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = selectedAnswer;
      setAnswers(newAnswers);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(newAnswers[currentQuestionIndex + 1] ?? null);
      } else {
        handleSubmitTest();
      }
    }
  };

  const handleSubmitTest = () => {
    if (isInitialAssessment) {
      const score = calculateScore(answers);
      onComplete(score, answers);
    } else {
      setShowResults(true);
    }
  };

  const isAnswerCorrect = (
    question: { options: string[]; correctAnswer: number | string },
    userAnswerIndex: number | undefined
  ) => {
    if (userAnswerIndex === undefined || userAnswerIndex === null) return false;

    const options = Array.isArray(question.options) ? question.options : [];
    const userAnswerText = options[userAnswerIndex];
    const raw = question.correctAnswer;

    if (typeof raw === 'number') {
      // Accept either 0-based or 1-based indexing from source data
      return userAnswerIndex === raw || userAnswerIndex === raw - 1;
    }

    const normalized = String(raw).trim();
    if (/^\d+$/.test(normalized)) {
      const numeric = Number(normalized);
      return userAnswerIndex === numeric || userAnswerIndex === numeric - 1;
    }

    return (userAnswerText || '').trim().toLowerCase() === normalized.toLowerCase();
  };

  const calculateScore = (userAnswers: number[]) => {
    let correct = 0;
    questions.forEach((question, index) => {
      const userAnswerIndex = userAnswers[index];
      if (isAnswerCorrect(question, userAnswerIndex)) {
        correct++;
      }
    });
    return Math.round((correct / (questions.length || 1)) * 100);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (showResults) {
    const score = calculateScore(answers);
    const passed = score >= 70;
    const canProceed = passed || isInitialAssessment;
    const correctCount = questions.reduce((count, question, index) => {
      return isAnswerCorrect(question, answers[index]) ? count + 1 : count;
    }, 0);
    const incorrectCount = Math.max(questions.length - correctCount, 0);

    return (
      <div className="animate-in fade-in mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 duration-500 md:p-8">
        <Card
          className={cn(
            'border-border/50',
            isInitialAssessment
              ? 'bg-primary/5 border-primary/20'
              : passed
                ? 'border-green-500/20 bg-green-500/5'
                : 'bg-destructive/5 border-destructive/20'
          )}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-6">
              {isInitialAssessment ? (
                <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
                  <Shield className="text-primary h-10 w-10" />
                </div>
              ) : passed ? (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
              ) : (
                <div className="bg-destructive/10 flex h-20 w-20 items-center justify-center rounded-full">
                  <XCircle className="text-destructive h-10 w-10" />
                </div>
              )}
            </div>

            <h2 className="mb-2 text-2xl font-bold tracking-tight">
              {isInitialAssessment ? 'Assessment Complete!' : 'Test Complete!'}
            </h2>
            <div
              className={cn(
                'mb-2 text-5xl font-black',
                isInitialAssessment
                  ? 'text-primary'
                  : passed
                    ? 'text-green-500'
                    : 'text-destructive'
              )}
            >
              {score}%
            </div>
            <p className="text-muted-foreground mb-8 shrink-0 text-lg">
              {passed
                ? 'Congratulations! You passed the test.'
                : isInitialAssessment
                  ? 'Assessment complete. You may proceed to the next module.'
                  : 'You need 70% to pass. Try again!'}
            </p>

            <div className="mb-8 grid w-full max-w-md grid-cols-1 gap-4 md:grid-cols-2">
              <div className="bg-background/50 border-border flex flex-col items-center rounded-lg border p-4">
                <div className="text-2xl font-bold text-green-500">{correctCount}</div>
                <div className="text-muted-foreground text-sm">Correct</div>
              </div>
              <div className="bg-background/50 border-border flex flex-col items-center rounded-lg border p-4">
                <div className="text-destructive text-2xl font-bold">{incorrectCount}</div>
                <div className="text-muted-foreground text-sm">Incorrect</div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => onComplete(score, answers)}
                disabled={!canProceed}
                variant={canProceed ? 'default' : 'secondary'}
                className={cn(
                  isInitialAssessment
                    ? 'bg-primary hover:bg-primary/90'
                    : passed
                      ? 'bg-green-600 hover:bg-green-700'
                      : ''
                )}
              >
                {isInitialAssessment
                  ? 'Begin Your Journey'
                  : canProceed
                    ? 'Complete Module'
                    : 'Retake Required'}
              </Button>
              <Button onClick={onBack} variant="outline">
                Back to Module
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Detailed Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = answers[index];
              const isCorrect = isAnswerCorrect(question, userAnswer);

              return (
                <div
                  key={index}
                  className={cn(
                    'rounded-lg border p-4 transition-colors',
                    isCorrect
                      ? 'border-green-500/20 bg-green-500/5'
                      : 'bg-destructive/5 border-destructive/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="text-destructive mt-0.5 h-5 w-5" />
                    )}
                    <div className="flex-1 space-y-2">
                      <p className="font-medium">{question.question}</p>
                      <div className="space-y-1 text-sm">
                        <p className="flex gap-2">
                          <span className="text-muted-foreground w-24 font-medium">
                            Your answer:
                          </span>
                          <span className={isCorrect ? 'text-green-500' : 'text-destructive'}>
                            {userAnswer !== undefined
                              ? question.options[Number(userAnswer)]
                              : 'Not answered'}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="flex gap-2">
                            <span className="text-muted-foreground w-24 font-medium">Correct:</span>
                            <span className="text-green-500">
                              {question.options[Number(question.correctAnswer)]}
                            </span>
                          </p>
                        )}
                      </div>
                      {question.explanation && (
                        <div className="text-muted-foreground bg-background/50 border-border/50 mt-2 rounded border p-3 text-sm">
                          <span className="mb-1 block text-xs font-semibold tracking-wider uppercase opacity-70">
                            Explanation
                          </span>
                          {question.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!questions || questions.length === 0 || !currentQuestion) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
        <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
          <Shield className="text-primary h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold">No Questions Found</h3>
          <p className="text-muted-foreground text-sm whitespace-pre-line">
            This module doesn&apos;t have any assessment questions configured yet.
          </p>
        </div>
        <Button onClick={onBack} variant="outline" className="mt-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 duration-500 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} size="sm" className="-ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="bg-border hidden h-6 w-px md:block"></div>
          <h1 className="hidden text-xl font-bold tracking-tight md:block">{moduleTitle}</h1>
        </div>
        <div
          className={cn(
            'bg-background flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-sm font-medium',
            timeLeft < 120
              ? 'border-destructive/50 text-destructive bg-destructive/5'
              : 'border-border text-muted-foreground'
          )}
        >
          <Clock className="h-4 w-4" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
        </div>
        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="border-border/50 flex min-h-[400px] flex-col">
        <CardHeader>
          <div className="bg-primary/5 text-primary mb-2 w-fit rounded px-2 py-1 text-xs font-bold">
            QUESTION {currentQuestionIndex + 1}
          </div>
          <h2 className="text-xl leading-tight font-bold md:text-2xl">
            {currentQuestion.question}
          </h2>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="grid gap-3">
            {currentQuestion.options.map((option: string, index: number) => (
              <div
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={cn(
                  'hover:bg-muted/50 relative flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all',
                  selectedAnswer === index
                    ? 'border-primary bg-primary/5 ring-primary/20 shadow-sm ring-1'
                    : 'border-muted bg-card hover:border-primary/50'
                )}
              >
                <div
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    selectedAnswer === index
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/30'
                  )}
                >
                  {selectedAnswer === index && (
                    <div className="bg-primary-foreground h-2 w-2 rounded-full" />
                  )}
                </div>
                <span
                  className={cn(
                    'font-medium',
                    selectedAnswer === index ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {option}
                </span>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="border-border/50 bg-muted/5 flex justify-between border-t p-6">
          <Button
            variant="outline"
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
                setSelectedAnswer(answers[currentQuestionIndex - 1] ?? null);
              }
            }}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
            className="min-w-[120px]"
          >
            {currentQuestionIndex === questions.length - 1
              ? isInitialAssessment
                ? 'Complete & Begin Journey'
                : 'Submit Test'
              : 'Next'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
