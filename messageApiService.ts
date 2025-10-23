import { EmailRequestModel, SMSRequestModel, TemplateNameAndContentModel } from '@/ApiModels/apiModel';
import { getApiClientByProps } from './axiosInstancs';
import { Head } from 'react-day-picker';

export const getSmsTemplate = async (apiUrl : string, token : string): Promise<TemplateNameAndContentModel[] | undefined> => {
    try{
        const apiClient = getApiClientByProps(apiUrl, token);
        const response = await apiClient.get<TemplateNameAndContentModel[]>(`/api/messages/getTemplates/sms`);
        return response.data;
         }
    catch(error)
    {
        console.log("Unable to fetch the Email Template");
    }
   
}
export const getEmailTemplate = async (apiUrl : string, token : string): Promise<TemplateNameAndContentModel[] | undefined> => {
    try{
        const apiClient = getApiClientByProps(apiUrl, token);
        const response = await apiClient.get<TemplateNameAndContentModel[]>(`/api/messages/getTemplates/email`);
        return response.data;
    }
    catch(error)
    {
        console.log("Unable to fetch the Email Template");
    }
   
}

export const getSmsTemplateByContext = async (apiUrl : string, token : string , templateContext:string): Promise<TemplateNameAndContentModel[] | undefined> => {
    try{
        const apiClient = getApiClientByProps(apiUrl, token);
        const response = await apiClient.post<TemplateNameAndContentModel[]>(`/api/messages/getTemplates/sms`, templateContext,
            { headers: { 'Content-Type': 'text/plain' } }
        );
        return response.data;
         }
    catch(error)
    {
        console.log("Unable to fetch the Email Template");
    }
   
}
export const getEmailTemplateByContext = async (apiUrl : string, token : string, templateContext:string): Promise<TemplateNameAndContentModel[] | undefined> => {
    try{
        const apiClient = getApiClientByProps(apiUrl, token);
        const response = await apiClient.post<TemplateNameAndContentModel[]>(`/api/messages/getTemplates/email`, templateContext,
            { headers: { 'Content-Type': 'text/plain' } }
        );
        return response.data;
    }
    catch(error)
    {
        console.log("Unable to fetch the Email Template");
    }
   
}

export const sendSms = async (smsRequestModel: SMSRequestModel,apiUrl : string, token : string): Promise<boolean> => {
    try{
        const apiClient = getApiClientByProps(apiUrl, token);
        await apiClient.put(`/api/messages/send/sms`, smsRequestModel);
        return true;
    }
    catch(error)
    {
        console.log("Unable to send sms", error);
        throw false;
    }
}

export const sendEmail = async (emailRequestModel: EmailRequestModel,apiUrl : string, token : string): Promise<boolean> => {
    try{
        const apiClient = getApiClientByProps(apiUrl, token);
        await apiClient.put(`/api/messages/send/email`, emailRequestModel);
        return true;
    }
    catch(error)
    {
        console.log("Unable to send sms", error);
        return false;
    }
}