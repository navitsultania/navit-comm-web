import axios, { AxiosInstance } from "axios";
import { getApiConfig } from '../../../config';

export function getApiClient(): AxiosInstance {
    const { baseUrl, token } = getApiConfig();

    if (!token) {
        throw new Error('Missing Configuration. Either refresh or check your configuration.');
    }
    return axios.create({
        baseURL: baseUrl,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });
}

export function getApiClientByProps(baseUrl : string, token : string): AxiosInstance {
    if (!token) {
        throw new Error('Missing Configuration. Either refresh or check your configuration.');
    }
    return axios.create({
        baseURL: baseUrl,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });
}

export function getPublicApiClientByProps(baseUrl: string): AxiosInstance{
    return axios.create({
        baseURL: baseUrl,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}