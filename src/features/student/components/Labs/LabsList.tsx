import React from 'react';
import { FlaskRound as Flask, Clock, CheckCircle, ArrowRight, Terminal, Activity, Lock, BookOpen, Users } from 'lucide-react';
import { labs } from '@data/labs';
import { useAuth } from '@context/AuthContext';
import { getCompletedLabs } from '@utils/labCompletion';
import { labApiService, LabStats } from '@services/labApiService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Progress } from '@shared/components/ui/progress';
import { Skeleton } from '@components/ui/skeleton';
import { cn } from '@lib/utils';

interface LabsListProps {
  onLabSelect: (labId: string) => void;
}

export const LabsList: React.FC<LabsListProps> = ({ onLabSelect }) => {
  const { user } = useAuth();
  const [completedLabs, setCompletedLabs] = React.useState<string[]>([]);
  const [labStats, setLabStats] = React.useState<LabStats | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string>('Web Security');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setCompletedLabs(getCompletedLabs());

    const loadLabStats = async () => {
      try {
        setLoading(true);
        const stats = await labApiService.getLabStats();
        setLabStats(stats);
        setCompletedLabs(stats.completedLabIds);
      } catch (error) {
        console.error('Error fetching lab stats:', error);
        setCompletedLabs(getCompletedLabs());
      } finally {
        setLoading(false);
      }
    };

    loadLabStats();
  }, []);

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'intermediate': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'advanced': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const categories = [...new Set(labs.map(l => l.category))];
  const filteredLabs = labs.filter(lab => lab.category === activeCategory);
  const completionPercentage = Math.round(labStats?.completionPercentage ?? (labs.length > 0 ? (completedLabs.length / labs.length) * 100 : 0));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Virtual Labs</h1>
          <p className="text-muted-foreground">Hands-on security simulations and practical exercises</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border/50">
          <Flask className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{labStats?.completedLabs ?? completedLabs.length} / {labStats?.totalLabs ?? labs.length} Completed</span>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Complete all labs to earn your certification
          </p>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 p-1 bg-card rounded-lg border border-border/50">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                activeCategory === category
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <span className="flex items-center gap-2">
                {category}
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  activeCategory === category ? "bg-primary-foreground/20" : "bg-muted"
                )}>
                  {labs.filter(l => l.category === category).length}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Labs Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/50">
              <CardHeader className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : labs.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Terminal className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Labs Available</h2>
            <p className="text-muted-foreground max-w-md">
              Lab simulations are currently being prepared. Check back soon for hands-on security training exercises.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredLabs.map((lab) => {
            const isProOnly = lab.difficulty === 'advanced' || lab.difficulty === 'pro';
            const isLocked = isProOnly && (user as any)?.subscription_tier !== 'pro';
            const isCompleted = completedLabs.includes(lab.id);

            return (
              <Card
                key={lab.id}
                className={cn(
                  "group transition-all duration-200 cursor-pointer",
                  isLocked
                    ? "opacity-60 border-border/30"
                    : "border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                  isCompleted && "border-primary/30 bg-primary/5"
                )}
                onClick={() => !isLocked && onLabSelect(lab.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn(
                        "p-2 rounded-lg border",
                        isLocked ? "bg-muted border-border" : "bg-primary/10 border-primary/20"
                      )}>
                        {isLocked ? <Lock className="h-5 w-5 text-muted-foreground" /> : <Terminal className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className={cn(
                          "text-lg line-clamp-1 transition-colors",
                          !isLocked && "group-hover:text-primary"
                        )}>
                          {lab.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border",
                            getDifficultyVariant(lab.difficulty)
                          )}>
                            {lab.difficulty}
                          </span>
                          {isCompleted && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-primary">
                              <CheckCircle className="h-3 w-3" /> Completed
                            </span>
                          )}
                          {isProOnly && (
                            <span className="text-[10px] font-semibold text-amber-500 uppercase">
                              Pro
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="line-clamp-2 mb-4">
                    {lab.description}
                  </CardDescription>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{lab.estimatedTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>Solo Mission</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {lab.tools.slice(0, 4).map((tool: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 text-[10px] font-medium bg-muted rounded-md border border-border/50"
                      >
                        {tool}
                      </span>
                    ))}
                    {lab.tools.length > 4 && (
                      <span className="px-2 py-0.5 text-[10px] text-muted-foreground">
                        +{lab.tools.length - 4} more
                      </span>
                    )}
                  </div>

                  <Button
                    variant={isCompleted ? "outline" : "default"}
                    className={cn(
                      "w-full",
                      isLocked && "pointer-events-none"
                    )}
                    disabled={isLocked}
                  >
                    {isLocked ? (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Unlock with Pro
                      </>
                    ) : isCompleted ? (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Review Lab
                      </>
                    ) : (
                      <>
                        <Terminal className="mr-2 h-4 w-4" />
                        Start Lab
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      {labs.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Lab Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="text-2xl font-bold text-primary">{labStats?.completedLabs ?? completedLabs.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Completed</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="text-2xl font-bold text-amber-500">{labStats ? labStats.totalLabs - labStats.completedLabs : labs.length - completedLabs.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Remaining</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Progress</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="text-2xl font-bold">~{labs.length * 60}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Minutes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};