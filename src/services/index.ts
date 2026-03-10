import axios, { AxiosResponse } from 'axios';

/**
 * Interface representing the question structure 
 * expected by your MongoDB/Express controller.
 */
export interface QuestionData {
  questionText: string;
  options: string[];
  correctAnswer: string;
  examType: string;
  examYear: string | number;
  subject: string;
  _id?: string; 
}

/**
 * Service to handle question uploads.
 * Matches your controller: exports.addQuestion = async (req, res) => ...
 */
export const questionService = async (
  jsonData: QuestionData | QuestionData[],
  setUploading: (uploading: boolean) => void
): Promise<QuestionData | QuestionData[]> => {
  
  const API_URL = 'https://past-questions-api.onrender.com/api/questions';

  try {
    // This is the POST request. 
    // Axios automatically stringifies the JSON and sets 'Content-Type: application/json'
    console.log("Sending POST request to backend with data:", jsonData);
    const response: AxiosResponse<QuestionData | QuestionData[]> = await axios.post(
      API_URL, 
      jsonData
    );
    setUploading(false);
    alert("Upload successful!y");
    return response.data;
  } catch (error: any) {
    // Extracts the { error: err.message } sent by your controller's catch block
    console.log(error);
    const errorMessage = error.response?.data?.error || "Server connection failed";
    throw new Error(errorMessage);
  }
};