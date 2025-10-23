
import { AvailableSlotRequestModel } from '@/ApiModels/available-slot-request-model';
import { MemberRequestModel } from '@/ApiModels/member-request-model';
import { AppointmentRequestModel } from '@/ApiModels/appointment-request-model';
import { MemberDefaultUsersResponseModel } from '@/ApiModels/member-default-users-response-model';
import { AvailableSlotResponseModel } from '@/ApiModels/available-slot-response-model';
import { getApiClientByProps } from './axiosInstancs';
import { MemberAppointmentResponseModel } from '@/ApiModels/apiModel';
import { ScheduleAppointmentDetailResponseModel } from '@/ApiModels/schedule-appointment-details-response-model';

export const addAppointment = async (AppointmentRequestModel: AppointmentRequestModel, apiUrl: string, token: string): Promise<MemberAppointmentResponseModel | undefined> => {
  try {
    
    const apiClient = getApiClientByProps(apiUrl, token);
    const response = await apiClient.post(`/api/appointments/add`, AppointmentRequestModel);
    return response.data;
  } catch (error) {
    console.error("Failed to save call history", error);
  }
};
export const registerMember = async (memberRequestModel: MemberRequestModel, apiUrl: string, token: string): Promise<any> => {
  try {
    const apiClient = getApiClientByProps(apiUrl, token);
    await apiClient.post(`/api/members/memberOrganizationId/register`, memberRequestModel);
  } catch (error) {
    console.error("Failed to save call history", error);
  }
};
export const getDefaultTimezone = async (apiUrl: string, token: string): Promise<string | undefined> => {
  try {
    const apiClient = getApiClientByProps(apiUrl, token);
    const response = await apiClient.get(`/api/available-slot`);
    return response.data;
  } catch (error) {
    console.error("Failed to save call history", error);
  }
};
export const getDefaultUsers = async (memberId: string, groupId: number, apiUrl: string, token: string): Promise<MemberDefaultUsersResponseModel[] | undefined> => {
    try {
        const apiClient = getApiClientByProps(apiUrl, token);
        const response = await apiClient.get(`/api/members/getDefaultUsers`, {
            params: { memberId, groupId }
        });
        return response.data;
    } catch (error) {
        console.error("Failed to get default users", error);
    }
};
export const mapMemberToUser = async (memberId: string, team: string[], apiUrl: string, token: string): Promise<void | Error> => {
    try {
        const apiClient = getApiClientByProps(apiUrl, token);
        await apiClient.post(
            `/api/members/memberOrganizationId/mapUsers`,
            team,
            { params: { memberId } }
        );
    } catch (error) {
        console.error("Failed to save call history", error);
    }
};
export const searchAvailableSlots = async (availableSlotRequest : AvailableSlotRequestModel, apiUrl: string, token: string): Promise<AvailableSlotResponseModel | undefined> => {
  try {
    const apiClient = getApiClientByProps(apiUrl, token);
    const response = await apiClient.post(`/api/available-slot`, availableSlotRequest);
    return response.data;
  } catch (error) {
    console.error("Failed to save call history", error);
  }
};
export const getModeByIdType = async (type: string, apiUrl: string, token: string): Promise<string | undefined> => {
    try {
      const apiClient = getApiClientByProps(apiUrl, token);
      const response = await apiClient.get(`/api/modes/getModeIdByType`, {
        params: { type },
      });
        return response.data;
    } catch (error) {
        console.error("Failed to get default users", error);
    }
};

export const getMemberAppointments = async (
  memberId: string,
  apiUrl: string,
  token: string
): Promise<MemberAppointmentResponseModel[] | undefined> => {
  try {
    const apiClient = getApiClientByProps(apiUrl, token);
    const startDate = new Date(0).toISOString(); // Use Unix epoch as default start date
    const endDate = new Date().toISOString();
    const response = await apiClient.get(
      `/api/members/getAppointments/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`,
      { params: { memberId } }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to get member appointments", error);
  }
};

export const getAppointmentDetails = async (appointmentId: string, apiUrl: string, token: string): Promise<ScheduleAppointmentDetailResponseModel | undefined> => {
  try {
    const apiClient = getApiClientByProps(apiUrl, token);
    const response = await apiClient.get(
      `/api/appointments/${appointmentId}/meta`
    );
    return response.data;
  }
  catch (error) {
    console.error("Failed to get appointment details", error);
  }
}

export const getCategoryIdByModeId = async(modeId: string , apiUrl: string, token: string): Promise<string | undefined> => {
  try {
    const apiClient = getApiClientByProps(apiUrl, token);
    const response = await apiClient.get(
      `/api/modes/getCategoryId`,
      {params : {modeId}}
    );
    return response.data;
  }
  catch (error) {
    console.error("Failed to get appointment details", error);
  }
}







