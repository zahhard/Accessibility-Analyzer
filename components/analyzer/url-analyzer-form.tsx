"use client";
import { yupResolver } from "@hookform/resolvers/yup";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { useAnalysisReport } from "@/hooks/use-analysis-report";
import { AnalysisProgress } from "./analysis-progress";
import { SampleUrls } from "./sample-urls";
const schema = yup.object({ url: yup.string().url("یک URL معتبر وارد کنید.").required("وارد کردن URL الزامی است.") });
type FormValues = yup.InferType<typeof schema>;
export function UrlAnalyzerForm() {
  const router = useRouter(); const mutation = useAnalysisReport();
  const { register, setValue, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: yupResolver(schema), defaultValues: { url: "" } });
  const submit = (values: FormValues) => mutation.mutate(values.url, { onSuccess: (data) => { sessionStorage.setItem("accessibility-report", JSON.stringify(data)); router.push("/report"); } });
  return <form onSubmit={handleSubmit(submit)} className="mt-7"><label htmlFor="url" className="mb-2 block text-sm font-medium text-slate-700">آدرس صفحه عمومی</label><div className="flex flex-col gap-3 sm:flex-row"><input id="url" {...register("url")} dir="ltr" placeholder="https://example.com" className="focus-ring min-h-14 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-left text-base text-slate-900 shadow-sm placeholder:text-slate-400 transition hover:border-slate-400 focus:border-teal-600" /><button type="submit" disabled={mutation.isPending} className="focus-ring flex min-h-14 items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">{mutation.isPending ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowLeft size={18} />}شروع تحلیل</button></div>{errors.url && <p className="mt-2 text-sm text-red-600">{errors.url.message}</p>}<div className="mt-4"><SampleUrls onSelect={(url) => setValue("url", url, { shouldValidate: true })} /></div>{mutation.isError && <div role="alert" className="mt-5 break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{mutation.error.message}</div>}{mutation.isPending && <AnalysisProgress />}</form>;
}
