import * as z from "zod";

export const formSchema = z.object({
  jobDescription: z.string().min(1, {
    message: "Job description is required."
  }),
  resume: z.instanceof(File, {
    message: "Resume file is required."
  })
});
