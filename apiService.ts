import axios, { AxiosInstance } from 'axios';
import { CallSidResponse, MeetingStatisticsRequestModel, MemberAppointmentResponseModel, MemberCallDetails, MemberCallHistoryModel, TemplateNameAndContentModel, TokenResponse, UserAppointmentDetailResponseModel, VideoCallInfo, VideoCallToken } from '@/ApiModels/apiModel';
import { getApiClient, getApiClientByProps, getPublicApiClientByProps } from './axiosInstancs';




export const fetchInboundToken = async (baseApiUrl: string, Accesstoken : string): Promise<TokenResponse> => {
    console.log("baseApiUrl : ", baseApiUrl);
    const apiClient = getApiClientByProps(baseApiUrl, Accesstoken );

    const response = await apiClient.post<TokenResponse>(`/api/call/deviceInboundToken`);
    return response.data;
};

export const fetchOutboundToken = async (baseApiUrl: string, Accesstoken : string): Promise<TokenResponse> => {
    const apiClient = getApiClientByProps(baseApiUrl, Accesstoken);
    const response = await apiClient.post<TokenResponse>(`/api/call/deviceOutboundToken`);
    return response.data;
};

// Make an outbound call
export const makeOutboundCall = async (from: string, to: string): Promise<CallSidResponse> => {
    const apiClient = getApiClient();
    const params = new URLSearchParams({ from, to });
    const response = await apiClient.post<CallSidResponse>(`/api/call/outbound?${params.toString()}`);
    return response.data;
};

// Handle inbound call
export const handleInboundCall = async (payload: string): Promise<string> => {
    try {
        const apiClient = getApiClient();
        const response = await apiClient.post<string>('/api/call/inbound', payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        return response.data;
    } catch (error) {
        return '';
    }
};

export const audioCallRecordingbyCallSid = async ( callSid: string, apiUrl: string, token: string): Promise<Blob | null> => {
  try {
    const apiClient = getApiClientByProps(apiUrl, token);
    const response = await apiClient.get(`/api/call/recording/${callSid}`, {
      responseType: 'blob', 
    });
    return response.data; 
  } catch (error) {
    console.error("Failed to fetch call recording:", error);
    return null;
  }
};

export const setAudioCallHistory = async (callSid: string, to: string, memberId: string, apiUrl: string, token: string): Promise<void> => {
  try {
    const memberCallDetails: MemberCallDetails = { callSid, to, memberId };
    console.log("memberCallDetails : ", memberCallDetails);
    const apiClient = getApiClientByProps(apiUrl, token);
    await apiClient.post(`/api/call/saveCallHistory`, memberCallDetails);
  } catch (error) {
    console.error("Failed to save call history", error);
  }
};

export const fetchMemberCallHistory = async (memberId: string, apiUrl: string, token: string): Promise<MemberCallHistoryModel[]> => {
    try {
        const apiClient = getApiClientByProps(apiUrl, token);
        const response = await apiClient.get<MemberCallHistoryModel[]>(`/api/call/getMemberCallHistory/${memberId}`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch member call history", error);
        return [];
    }
}


export const fetchAcsVideoToken = async (meetingId: string, apiUrl : string, token : string): Promise<VideoCallInfo | null> => {
    try {
        const apiClient = getApiClientByProps(apiUrl, token);
        const response = await apiClient.get<VideoCallInfo>(`/api/video/${meetingId}/token`);
        return response.data;
    } catch (error) {
        return null;
    }
}

export const refreshAcsVideoToken = async (userId: string, apiUrl : string, token : string): Promise<string> => {
    try {
        const apiClient = getApiClientByProps(apiUrl, token);
        const response = await apiClient.get<VideoCallToken>(`/api/video/${userId}/refreshToken`);
        return response.data.token;
    } catch (error) {
        return '';
    }
}

export const saveMeetingStatistics = async (meetingId : string, request: MeetingStatisticsRequestModel, apiUrl : string, token : string): Promise<void> => {
    const apiClient = getApiClientByProps(apiUrl, token);
    await apiClient.post(`/api/${meetingId}/saveMeetingStats`, request, {
        headers: { 'Content-Type': 'application/json' },
    });
};

export const fetchAppointmentDetails = async (id: string, apiUrl: string, token: string): Promise<UserAppointmentDetailResponseModel> => {
    const apiClient = getApiClientByProps(apiUrl, token);
    const response = await apiClient.get<UserAppointmentDetailResponseModel>(`/api/appointments/${id}/meta`);
    return response.data;
};

export const fetchMemberAppointments = async (memberId: string, startDate: string,endDate: string, apiUrl: string, token: string): Promise<MemberAppointmentResponseModel[]> => {
    const apiClient = getApiClientByProps(apiUrl, token);
    const response = await apiClient.get<MemberAppointmentResponseModel[]>(`/api/members/${memberId}/getAppointments/${startDate}/${endDate}`);
    return response.data;
}

export const startRecording = async (meetingId: string, serverCallId:string, apiUrl: string, token: string): Promise<void> => {
    const apiClient = getApiClientByProps(apiUrl, token);
    await apiClient.get(`/api/video/${meetingId}/recording/${serverCallId}`);
}

export const stopRecording = async (meetingId: string, apiUrl: string, token: string): Promise<void> => {
    const apiClient = getApiClientByProps(apiUrl, token);
    await apiClient.get(`/api/video/${meetingId}/stopRecording`);
}

export const fetchPublicAcsVideoToken = async(meetingId: string, organizationId: number, apiUrl: string): Promise<VideoCallInfo | null> => {
    try {
        const apiClient = getPublicApiClientByProps(apiUrl);
        const response = await apiClient.get<VideoCallInfo>(`/api/callback/video/${meetingId}/token/${organizationId}`);
        return response.data;
    } catch (error) {
        return null;
    }
}
