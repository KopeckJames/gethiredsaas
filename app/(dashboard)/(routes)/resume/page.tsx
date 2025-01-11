"use client";

import * as z from "zod";
import axios from "axios";
import { FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/loader";
import { Empty } from "@/components/ui/empty";
import { useProModal } from "@/hooks/use-pro-modal";
import { Card } from "@/components/ui/card";

const formSchema = z.object({
  jobDescription: z.string().min(1, {
    message: "Job description is required."
  }),
  resume: z.instanceof(File, {
    message: "Resume file is required."
  })
});

interface AnalysisResult {
  score: number;
  recommendations: string[];
  optimizedContent?: string;
}

const ResumePage = () => {
  const router = useRouter();
  const proModal = useProModal();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobDescription: "",
      resume: undefined
    }
  });

  const isLoading = form.formState.isSubmitting;
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const formData = new FormData();
      formData.append("jobDescription", values.jobDescription);
      if (selectedFile) {
        formData.append("resume", selectedFile);
      }
      
      const response = await axios.post('/api/analysis', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      form.reset();
      setSelectedFile(null);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        proModal.onOpen();
      } else if (error?.response?.status === 429) {
        toast.error("Our AI system is experiencing high demand. Please try again in a few moments.");
      } else if (error?.response?.data) {
        // Use the error message from the server if available
        toast.error(error.response.data);
      } else {
        toast.error("Failed to analyze resume. Please try again.");
      }
    } finally {
      router.refresh();
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['.txt', '.doc', '.docx'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error("Please upload a .txt, .doc, or .docx file only");
        e.target.value = ''; // Reset file input
        return;
      }

      setSelectedFile(file);
      form.setValue('resume', file);
    }
  };

  return ( 
    <div>
      <Heading
        title="ATS Resume Analysis"
        description="Upload your resume (.txt, .doc, or .docx files only) and job description to get ATS optimization suggestions."
        icon={FileText}
        iconColor="text-blue-700"
        bgColor="bg-blue-700/10"
      />
      <div className="px-4 lg:px-8">
        <div>
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmit)} 
              className="rounded-lg border w-full p-4 px-3 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2"
            >
              <FormField
                name="jobDescription"
                render={({ field }) => (
                  <FormItem className="col-span-12 lg:col-span-10">
                    <FormControl className="m-0 p-0">
                      <Input
                        className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                        disabled={isLoading} 
                        placeholder="Paste the job description here..." 
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="col-span-12 lg:col-span-10">
                <Input
                  type="file"
                  accept=".txt,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-500">
                    Selected file: {selectedFile.name}
                  </p>
                )}
              </div>
              <Button 
                className="col-span-12 lg:col-span-2 w-full" 
                type="submit" 
                disabled={isLoading || !selectedFile} 
                size="icon"
              >
                Analyze
              </Button>
            </form>
          </Form>
        </div>
        <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
              <Loader />
            </div>
          )}
          {!result && !isLoading && (
            <Empty label="No analysis performed yet." />
          )}
          {result && (
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">
                  ATS Score: {result.score}%
                </h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={cn(
                      "h-2.5 rounded-full",
                      result.score >= 70 ? "bg-green-600" : "bg-red-600"
                    )}
                    style={{ width: `${result.score}%` }}
                  />
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                <ul className="list-disc pl-4 space-y-2">
                  {result.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </Card>

              {result.optimizedContent && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Optimized Resume Content</h3>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {result.optimizedContent}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
   );
}
 
export default ResumePage;
