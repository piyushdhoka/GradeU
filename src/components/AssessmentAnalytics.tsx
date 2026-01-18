import React, { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@lib/supabase';

// Types removed for JavaScript conversion

export const AssessmentAnalytics: React.FC = () => {
  type Resp = { id: string; question_id: string; is_correct: boolean; confidence_level: number; user_id?: string; user?: { name?: string; email?: string; level?: string }; selected_answer?: number; time_taken_seconds?: number };
  type QAnalytics = { question_id: string; question_text: string; total_responses: number; correct_responses: number; average_confidence: number; difficulty_rating: number; common_wrong_answers: { answer: number; count: number }[] };

  const [responses, setResponses] = useState<Resp[]>([]);
  const [questionAnalytics, setQuestionAnalytics] = useState<QAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  // selectedQuestion removed (not yet implemented); track selection via click handler if needed

  useEffect(() => {
    loadAssessmentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Realtime updates for assessment responses and related user data changes
    const channel = supabase
      .channel('assessment-analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assessment_responses' }, () => {
        loadAssessmentData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        // User name/level changes should reflect in recent responses
        loadAssessmentData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAssessmentData = async () => {
    try {
      setLoading(true);
      
      // Load all assessment responses with user data
      const { data: responsesData, error: responsesError } = await supabase
        .from('assessment_responses')
        .select(`
          *,
          user:users(name, email, level)
        `)
        .order('created_at', { ascending: false });

      if (responsesError) throw responsesError;
      setResponses(responsesData || []);

      // Process question analytics
      const analytics = processQuestionAnalytics(responsesData || []);
      setQuestionAnalytics(analytics);
      
    } catch (error) {
      console.error('Failed to load assessment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processQuestionAnalytics = (responses: Resp[]) => {
    const questionMap = new Map<string, { responses: Resp[]; question_text: string }>();

    // Group responses by question
    responses.forEach(response => {
      if (!questionMap.has(response.question_id)) {
        questionMap.set(response.question_id, {
          responses: [],
          question_text: `Question ${response.question_id}`
        });
      }
      questionMap.get(response.question_id)!.responses.push(response);
    });

    // Calculate analytics for each question
    return Array.from(questionMap.entries()).map(([questionId, data]) => {
      const questionResponses = data.responses;
      const totalResponses = questionResponses.length;
      const correctResponses = questionResponses.filter(r => r.is_correct).length;
      const averageConfidence = questionResponses.reduce((sum, r) => sum + r.confidence_level, 0) / totalResponses;
      
      // Calculate difficulty rating (lower success rate = higher difficulty)
      const successRate = correctResponses / totalResponses;
      const difficultyRating = Math.round((1 - successRate) * 5);

      // Find common wrong answers
      const wrongAnswers = questionResponses.filter(r => !r.is_correct);
      const answerCounts = new Map<number, number>();
      wrongAnswers.forEach(r => {
        const ans = typeof r.selected_answer === 'number' ? r.selected_answer : -1;
        answerCounts.set(ans, (answerCounts.get(ans) || 0) + 1);
      });
      
      const commonWrongAnswers = Array.from(answerCounts.entries())
        .map(([answer, count]) => ({ answer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      return {
        question_id: questionId,
        question_text: data.question_text,
        total_responses: totalResponses,
        correct_responses: correctResponses,
        average_confidence: averageConfidence,
        difficulty_rating: difficultyRating,
        common_wrong_answers: commonWrongAnswers
      };
    }).sort((a, b) => b.total_responses - a.total_responses);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 4) return 'badge-strong-emerald';
    if (confidence >= 3) return 'badge-emerald';
    if (confidence >= 2) return 'badge-amber';
    return 'badge-danger';
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 4) return 'badge-danger';
    if (difficulty >= 3) return 'badge-amber';
    if (difficulty >= 2) return 'badge-warning';
    return 'badge-emerald';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Assessment Analytics</h1>
          <p className="text-muted">Analyze student performance and confidence levels</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm font-medium">Total Responses</p>
                <p className="text-3xl font-bold text-primary">{responses.length}</p>
              </div>
              <BarChart3 className="h-12 w-12 accent-emerald" />
            </div>
          </div>

          <div className="bg-card border border-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm font-medium">Avg Accuracy</p>
                <p className="text-3xl font-bold text-primary">
                  {responses.length > 0 ? Math.round((responses.filter(r => r.is_correct).length / responses.length) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="h-12 w-12 accent-emerald" />
            </div>
          </div>

          <div className="bg-card border border-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm font-medium">Avg Confidence</p>
                <p className="text-3xl font-bold text-primary">
                  {responses.length > 0 ? (responses.reduce((sum, r) => sum + r.confidence_level, 0) / responses.length).toFixed(1) : '0.0'}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 accent-amber" />
            </div>
          </div>

          <div className="bg-card border border-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-sm font-medium">Unique Students</p>
                <p className="text-3xl font-bold text-primary">
                  {new Set(responses.map(r => r.user_id)).size}
                </p>
              </div>
              <Users className="h-12 w-12 accent-amber" />
            </div>
          </div>
        </div>

        {/* Question Analytics */}
        <div className="bg-muted border border-card rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-primary mb-6">Question Performance Analysis</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Question</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Responses</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Accuracy</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Avg Confidence</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Difficulty</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questionAnalytics.map((question) => (
                  <tr key={question.question_id} className="border-b border-card/50 hover:bg-card">
                    <td className="py-4 px-4">
                      <div className="text-white font-medium">Question {question.question_id}</div>
                      <div className="text-slate-400 text-sm">{question.question_text}</div>
                    </td>
                    <td className="py-4 px-4 text-primary">{question.total_responses}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-primary">
                          {Math.round((question.correct_responses / question.total_responses) * 100)}%
                        </span>
                        {question.correct_responses / question.total_responses >= 0.7 ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(question.average_confidence)}`}>
                        {question.average_confidence.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty_rating)}`}>
                        {question.difficulty_rating}/5
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => console.log('View details for', question.question_id)}
                        className="text-primary hover:text-muted transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Responses */}
        <div className="bg-muted border border-card rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-primary mb-6">Recent Student Responses</h2>
          
          <div className="space-y-4">
            {responses.slice(0, 10).map((response) => (
              <div key={response.id} className="bg-card rounded-xl p-4 border border-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-primary font-medium">{response.user?.name || 'Unknown User'}</div>
                      <div className="text-muted text-sm">{response.user?.email}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        response.user?.level === 'advanced' ? 'badge-danger' :
                        response.user?.level === 'intermediate' ? 'badge-amber' :
                        'badge-emerald'
                      }`}>
                        {response.user?.level}
                      </span>
                    </div>
                    <div className="text-slate-300 text-sm">
                      Question {response.question_id} • Answer: {response.selected_answer} • 
                      Time: {response.time_taken_seconds}s
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(response.confidence_level)}`}>
                      Confidence: {response.confidence_level}/5
                    </span>
                    {response.is_correct ? (
                      <CheckCircle className="h-5 w-5 accent-emerald" />
                    ) : (
                      <XCircle className="h-5 w-5 accent-amber" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};