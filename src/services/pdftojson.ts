import axios, { AxiosResponse, AxiosProgressEvent } from 'axios';

const API_BASE_URL = 'https://past-questions-api.onrender.com/api';

// 1. Define types for the request and response
export interface ExamMetadata {
  examType: string;
  subject: string;
  examYear: string | number;
}

export interface Question {
  examType: string;
  subject: string;
  examYear: string | number;
  questionNumber: number;
  questionText: string;
  options: string[];
}

export interface ParsePDFResponse {
  success: boolean;
  totalQuestions: number;
  questions: Question[];
}

/**
 * Service to upload and parse an exam PDF
 */
export const parseExamPDF = async (
  file: File, 
  metadata: ExamMetadata
): Promise<ParsePDFResponse> => {
  const { examType, subject, examYear } = metadata;

  const formData = new FormData();
  
  // The key 'file' must match upload.single('file') in your Express route
  formData.append('file', file);
  formData.append('examType', examType);
  formData.append('subject', subject);
  formData.append('examYear', String(examYear));

  try {
    const response: AxiosResponse<ParsePDFResponse> = await axios.post(
      `${API_BASE_URL}/parse/parse-pdf`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        },
      }
    );

    return response.data;
  } catch (error: any) {
    // Handling typed error responses from Express
    const errorMessage = error.response?.data?.error || 'Network Error';
    console.error('Error parsing PDF:', errorMessage);
    throw new Error(errorMessage);
  }
};
