import React, { useRef } from 'react';
import { Award, Download } from 'lucide-react';
import { supabase } from '@lib/supabase';
import { useAuth } from '@context/AuthContext';
import { Button } from '@shared/components/ui/button';


interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
  studentName: string;
  completionDate: Date;
  facultyName?: string;
  isVU?: boolean;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  courseName,
  studentName,
  completionDate,
  facultyName,
  isVU = false
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generateBlob = async (): Promise<Blob | null> => {
    if (!certificateRef.current) return null;
    try {
      const { toBlob } = await import('html-to-image');
      const blob = await toBlob(certificateRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true
      });
      return blob;
    } catch (e) {
      console.error("Canvas generation failed", e);
      return null;
    }
  };

  const uploadAndSave = async (blob: Blob) => {
    const userId = user?.id;
    if (!userId) return;

    const fileExt = 'png';
    const sanitizedCourse = courseName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `${userId}_${sanitizedCourse}_${Date.now()}.${fileExt}`;
    const filePath = `certificates/${fileName}`;

    console.log("Uploading certificate:", filePath);
    const { error: uploadError } = await supabase.storage.from('certificates').upload(filePath, blob, { contentType: 'image/png' });

    if (uploadError) {
      console.error('Failed to upload certificate to storage:', uploadError.message);
      return;
    }

    const { data: publicData } = supabase.storage.from('certificates').getPublicUrl(filePath);
    const publicUrl = publicData?.publicUrl ?? '';

    console.log("Certificate Public URL:", publicUrl);

    // Update certificates table
    const { data: courseRows } = await supabase.from('courses').select('id').ilike('title', courseName).limit(1);
    let courseId = courseRows?.[0]?.id;

    if (!courseId) {
      // Optional: Auto-create course record if missing (for legacy compatibility)
      const { data: newCourseRows } = await supabase.from('courses').insert({ title: courseName }).select().limit(1);
      courseId = newCourseRows?.[0]?.id;
    }

    if (courseId) {
      const { error: dbError } = await supabase.from('certificates').upsert([{
        student_id: userId,
        course_id: courseId,
        certificate_url: publicUrl,
        issued_at: new Date().toISOString()
      }], { onConflict: 'student_id, course_id' });

      if (dbError) {
        console.error("Failed to save certificate record to DB:", dbError);
      } else {
        console.log("Certificate record saved successfully.");
      }
    }
  };

  const [isDownloading, setIsDownloading] = React.useState(false);

  // Auto-save effect
  React.useEffect(() => {
    if (isOpen && user && certificateRef.current) {
      if (!isGenerating) {
        setIsGenerating(true);
        // Delay slightly to ensure fonts/images render
        const timer = setTimeout(async () => {
          console.log("Auto-generating certificate...");
          const blob = await generateBlob();
          if (blob) {
            await uploadAndSave(blob);
          }
          setIsGenerating(false);
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, user?.id]); // Depend on ID to be stable

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;

    setIsDownloading(true);
    try {
      console.log("Starting download process...");
      // Generate High-Res Image Blob
      const blob = await generateBlob();
      if (!blob) {
        throw new Error("Failed to generate certificate image");
      }

      // Upload PNG to Supabase for Profile (Background task - Non-blocking)
      console.log("Triggering background upload...");
      uploadAndSave(blob).catch(err => console.error("Background upload failed:", err));

      // Generate PDF for User Download
      console.log("Importing jsPDF...");
      const { jsPDF } = await import('jspdf');

      // Convert Blob to Data URL for jsPDF
      console.log("Converting to DataURL...");
      const base64data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Create PDF matching content dimensions
      console.log("Creating PDF structure...");
      const width = certificateRef.current.offsetWidth;
      const height = certificateRef.current.offsetHeight;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [width, height],
        hotfixes: ['px_scaling']
      });

      pdf.addImage(base64data, 'PNG', 0, 0, width, height);
      console.log("Saving PDF...");
      pdf.save(`${courseName.replace(/\s+/g, '_')}_Certificate.pdf`);
      console.log("Download triggered.");

    } catch (err) {
      console.error("Certificate generation failed:", err);
      alert("Could not generate certificate download. Please try again or check console for details.");
    } finally {
      setIsDownloading(false);
    }
  };

  const formattedDate = completionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col">

        {/* Certificate Area */}
        <div className="grow flex flex-col md:flex-row relative">

          {/* Main Certificate Content - Left Side */}
          <div
            ref={certificateRef}
            style={{
              display: 'flex',
              position: 'relative',
              width: '850px',
              minHeight: '600px',
              backgroundColor: '#ffffff',
              color: '#000000',
              fontFamily: "'Times New Roman', serif",
              boxSizing: 'border-box'
            }}
          >
            {/* Visual Border */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                bottom: '16px',
                left: '16px',
                borderWidth: '2px',
                borderStyle: 'double',
                borderColor: '#e5e7eb',
                pointerEvents: 'none'
              }}
            />

            {/* Left Content Column */}
            <div
              style={{
                flex: 1,
                padding: '48px',
                paddingRight: '0px',
                paddingLeft: '64px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 10
              }}
            >

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '48px' }}>
                <img src="/logo.svg" alt="GradeU" style={{ height: '64px', objectFit: 'contain', maxWidth: '200px' }} />
              </div>

              <p style={{ marginBottom: '8px', fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#6b7280' }}>
                {formattedDate}
              </p>

              <h1 style={{ fontSize: '48px', fontFamily: "'Times New Roman', serif", marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.025em', color: '#000000', fontWeight: 'normal' }}>
                {studentName}
              </h1>

              <p style={{ fontStyle: 'italic', marginBottom: '24px', fontFamily: "'Times New Roman', serif", fontSize: '18px', color: '#6b7280' }}>
                has successfully completed
              </p>

              <h2 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '32px', lineHeight: '1.25', fontFamily: 'Arial, sans-serif', color: '#000000' }}>
                {courseName}
              </h2>

              <p style={{ fontSize: '14px', marginBottom: '48px', fontFamily: 'Arial, sans-serif', maxWidth: '28rem', lineHeight: '1.625', color: '#6b7280' }}>
                an online non-credit course authorized by GradeU and offered through the GradeU Academic Initiative.
              </p>

              <div style={{ marginTop: 'auto' }}>
                {isVU && facultyName ? (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontSize: '24px', marginBottom: '4px' }}>{facultyName}</p>
                    <div style={{ width: '192px', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderColor: '#000000' }}></div>
                    <p style={{ fontSize: '12px', marginTop: '4px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', color: '#374151' }}>Prof. {facultyName}</p>
                    <p style={{ fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#6b7280' }}>Faculty Guide, Vishwakarma University</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontSize: '24px', marginBottom: '4px' }}>{facultyName || 'GradeU'}</p>
                    <div style={{ width: '192px', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderColor: '#000000' }}></div>
                    <p style={{ fontSize: '12px', marginTop: '4px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', color: '#374151' }}>Chief Academic Officer</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar Column */}
            <div
              style={{
                width: '288px',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderLeftWidth: '1px',
                borderLeftStyle: 'solid',
                borderColor: '#f3f4f6',
                position: 'relative',
                zIndex: 10
              }}
            >

              <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '12px', fontFamily: 'Arial, sans-serif', marginBottom: '4px', color: '#9ca3af' }}>Course</p>
                <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '14px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', color: '#6b7280' }}>Certificate</p>
              </div>

              <div style={{ position: 'relative', marginBottom: '64px' }}>
                {/* CSS Badge */}
                <div style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '9999px',
                  borderWidth: '4px',
                  borderStyle: 'dashed',
                  borderColor: '#d1d5db',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '9999px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: '#111827',
                    color: '#ffffff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}>
                    <Award style={{ width: '40px', height: '40px', marginBottom: '8px', color: '#ffffff' }} />
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.1em', lineHeight: '1.25' }}>{courseName}<br />Certified</span>
                  </div>
                </div>
              </div>

              <div style={{ paddingLeft: '24px', paddingRight: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '10px', lineHeight: '1.625', fontFamily: 'Arial, sans-serif', color: '#d1d5db' }}>
                  Verify at sovap.security/verify/T4TNDR<br />
                  GradeU has confirmed the identity of this individual.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Controls */}
        <div className="bg-zinc-900 px-6 py-4 border-t border-white/10 flex justify-end items-center gap-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-white/5"
          >
            Close
          </Button>
          <Button
            onClick={downloadCertificate}
            disabled={isDownloading}
            className="bg-primary text-black font-bold hover:bg-primary/90"
          >
            {isDownloading ? (
              <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            <span>{isDownloading ? 'Processing...' : 'Download Official PDF'}</span>
          </Button>
        </div>
      </div>
    </div >
  );
};