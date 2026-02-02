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
  questions?: { question: string; options: string[]; correctAnswer: number | string; explanation?: string }[];
  isInitialAssessment?: boolean;
}

export const ModuleTest: React.FC<ModuleTestProps> = ({ moduleId, moduleTitle, onComplete, onBack, questions = [], isInitialAssessment = false }) => {
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
    setShowResults(true);
  };

  const calculateScore = (userAnswers: number[]) => {
    let correct = 0;
    questions.forEach((question, index) => {
      const userAnswerIndex = userAnswers[index];
      if (userAnswerIndex === undefined || userAnswerIndex === null) return;

      const userAnswerText = question.options[userAnswerIndex];
      const correctAnswer = question.correctAnswer;

      // Robust comparison for index or text match
      const isCorrect =
        String(userAnswerIndex) === String(correctAnswer) ||
        userAnswerText === correctAnswer;

      if (isCorrect) {
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

    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500 max-w-4xl mx-auto w-full">
        <Card className={cn(
          "border-border/50",
          isInitialAssessment ? "bg-primary/5 border-primary/20" :
            passed ? "bg-green-500/5 border-green-500/20" : "bg-destructive/5 border-destructive/20"
        )}>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-6">
              {isInitialAssessment ? (
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
              ) : passed ? (
                <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold tracking-tight mb-2">
              {isInitialAssessment ? 'Assessment Complete!' : 'Test Complete!'}
            </h2>
            <div className={cn("text-5xl font-black mb-2", isInitialAssessment ? "text-primary" : passed ? "text-green-500" : "text-destructive")}>
              {score}%
            </div>
            <p className="text-lg text-muted-foreground mb-8">
              {passed ? 'Congratulations! You passed the test.' : isInitialAssessment ? 'Assessment complete. You may proceed to the next module.' : 'You need 70% to pass. Try again!'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mb-8">
              <div className="bg-background/50 border border-border p-4 rounded-lg flex flex-col items-center">
                <div className="text-2xl font-bold text-green-500">{answers.filter((answer, index) => Number(answer) === Number(questions[index]?.correctAnswer)).length}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="bg-background/50 border border-border p-4 rounded-lg flex flex-col items-center">
                <div className="text-2xl font-bold text-destructive">{questions.length - answers.filter((answer, index) => Number(answer) === Number(questions[index]?.correctAnswer)).length}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => onComplete(score, answers)}
                disabled={!canProceed}
                variant={canProceed ? "default" : "secondary"}
                className={cn(
                  isInitialAssessment ? "bg-primary hover:bg-primary/90" :
                    passed ? "bg-green-600 hover:bg-green-700" : ""
                )}
              >
                {isInitialAssessment ? 'Begin Your Journey' : canProceed ? 'Complete Module' : 'Retake Required'}
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
              const isCorrect = Number(userAnswer) === Number(question.correctAnswer);

              return (
                <div key={index} className={cn(
                  "border rounded-lg p-4 transition-colors",
                  isCorrect ? "bg-green-500/5 border-green-500/20" : "bg-destructive/5 border-destructive/20"
                )}>
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                    )}
                    <div className="flex-1 space-y-2">
                      <p className="font-medium">{question.question}</p>
                      <div className="text-sm space-y-1">
                        <p className="flex gap-2">
                          <span className="font-medium text-muted-foreground w-24">Your answer:</span>
                          <span className={isCorrect ? "text-green-500" : "text-destructive"}>
                            {userAnswer !== undefined ? question.options[Number(userAnswer)] : 'Not answered'}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="flex gap-2">
                            <span className="font-medium text-muted-foreground w-24">Correct:</span>
                            <span className="text-green-500">
                              {question.options[Number(question.correctAnswer)]}
                            </span>
                          </p>
                        )}
                      </div>
                      {question.explanation && (
                        <div className="mt-2 text-sm text-muted-foreground bg-background/50 p-3 rounded border border-border/50">
                          <span className="font-semibold block mb-1 text-xs uppercase tracking-wider opacity-70">Explanation</span>
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

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} size="sm" className="-ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="h-6 w-px bg-border hidden md:block"></div>
          <h1 className="text-xl font-bold tracking-tight hidden md:block">{moduleTitle}</h1>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border bg-background font-mono text-sm font-medium",
          timeLeft < 120 ? "border-destructive/50 text-destructive bg-destructive/5" : "border-border text-muted-foreground"
        )}>
          <Clock className="h-4 w-4" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
        </div>
        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="border-border/50 min-h-[400px] flex flex-col">
        <CardHeader>
          <div className="bg-primary/5 text-primary text-xs font-bold px-2 py-1 rounded w-fit mb-2">
            QUESTION {currentQuestionIndex + 1}
          </div>
          <h2 className="text-xl md:text-2xl font-bold leading-tight">{currentQuestion.question}</h2>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="grid gap-3">
            {currentQuestion.options.map((option: string, index: number) => (
              <div
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={cn(
                  "relative flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-muted/50",
                  selectedAnswer === index
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                    : "border-muted bg-card hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                  selectedAnswer === index ? "border-primary bg-primary" : "border-muted-foreground/30"
                )}>
                  {selectedAnswer === index && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                </div>
                <span className={cn(
                  "font-medium",
                  selectedAnswer === index ? "text-primary" : "text-foreground"
                )}>
                  {option}
                </span>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t border-border/50 p-6 bg-muted/5">
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
            {currentQuestionIndex === questions.length - 1 ? 'Submit Test' : 'Next'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};