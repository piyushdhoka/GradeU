import React, { useState } from 'react';
import { useAuth } from '@context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@components/ui/button';
import { Textarea } from '@shared/components/ui/textarea';
import { toast } from 'sonner';
import { Bug, Send, Loader2 } from 'lucide-react';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please describe the problem you're experiencing.");
      return;
    }

    setIsSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/student/support/report-bug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          studentName: user?.name || 'Anonymous',
          studentEmail: user?.email || 'N/A',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Bug report submitted successfully!');
        setDescription('');
        onClose();
      } else {
        toast.error(data.error || 'Failed to submit bug report. Please try again.');
      }
    } catch (error) {
      console.error('Bug report submission error:', error);
      toast.error('An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-sidebar-border bg-sidebar text-sidebar-foreground sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bug className="text-primary size-5" />
            Report a Problem
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Stuck or encountered a bug? Tell us what happened and we'll look into it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Describe what happened, where you got stuck, or the bug you found..."
              className="bg-background border-sidebar-border focus-visible:ring-primary min-h-[150px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/10 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Report
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
