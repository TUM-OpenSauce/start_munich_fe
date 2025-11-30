// apiClient.ts
import axios, { AxiosError } from "axios"; // Import AxiosError
import type { AxiosInstance, AxiosRequestConfig } from "axios";

// -----------------------------------------------------------------------------
// TYPES — From your OpenAPI spec (Unchanged)
// -----------------------------------------------------------------------------

export interface BuyerRequest {
    emailAddress: string;
    name: string;
    company: string;
}

export interface Buyer extends BuyerRequest {
    buyerId: string;
}

export interface ProjectRequest {
    name: string;
    description: string;
}

export interface ProjectDTO extends ProjectRequest {
    buyerId: string;
}

export interface Project extends ProjectRequest {
    project_id: string;
    vendors: Vendor[];
}

export interface VendorRequest {
    emailAddress: string;
    name: string;
    company: string;
    project_id: string;
}

export interface Vendor extends VendorRequest {
    vendor_id: string;
}

export interface EmailRequest {
    sender: string;
    receiver: string;
    emailSubject: string;
    emailContent: string;
    datetimeEmailSend?: string;
    attachment?: string; // Base64
}

export interface Email extends EmailRequest {
    EmailId: string;
    status: "draft" | "sent" | "failed";
}

// Forecaster Chat Types
export interface ForecasterRequest {
    vendor_id: string;
    message: string;
    negotiationContext?: {
        productName?: string;
        dealPhase?: string;
        overallDealHealthScore?: number;
        latestQuotedPrice?: number;
        buyerTargetPrice?: string;
        remainingWiggleRoom?: number;
        stalemateRiskProbability?: number;
        sellerUrgencyScore?: number;
        buyerPowerIndex?: number;
        recommendedStrategy?: string;
        summary?: string;
    };
}

export interface ForecasterResponse {
    id: string;
    vendorId: string;
    message: string;
    response: string;
    timestamp: string;
    confidence?: number;
    suggestions?: string[];
}

// 💥 Custom Error Type for better handling
export interface ApiError extends ErrorResponse {
    status?: number; // HTTP status code
    originalError: AxiosError | Error;
}

export interface ErrorResponse {
    code?: number;
    message?: string;
}

// -----------------------------------------------------------------------------
// API CLIENT
// -----------------------------------------------------------------------------

export interface ApiClientConfig {
    baseURL?: string;
    token?: string;
    axiosConfig?: AxiosRequestConfig;
}

export class ApiClient {
    private axios: AxiosInstance;
    private token?: string; // Added token back for consistency

    constructor(config: ApiClientConfig = {}) {
        this.token = config.token; // Added token back

        this.axios = axios.create({
            baseURL: config.baseURL ?? "/api",
            ...config.axiosConfig,
        });

        // Attach bearer token automatically (Added back)
        this.axios.interceptors.request.use((req) => {
            if (this.token) {
                req.headers.set("Authorization", `Bearer ${this.token}`);
            }
            return req;
        });
    }
    
    /** Update JWT token at runtime */
    setToken(token: string) {
        this.token = token;
    }

    /** 💥 Private helper to process API errors */
    private handleError(error: unknown): never {
        const customError: ApiError = {
            status: 0,
            message: "An unknown error occurred.",
            originalError: error as Error,
        };

        if (axios.isAxiosError(error)) {
            customError.status = error.response?.status;
            customError.message = error.message;

            // Check if the server returned a structured error body
            const serverError = error.response?.data as ErrorResponse;
            if (serverError && serverError.message) {
                customError.message = serverError.message;
                customError.code = serverError.code;
            }
        }
        
        // Throw the custom error for the caller to catch
        throw customError;
    }

    // --------------------------------------------------
    // BUYERS
    // --------------------------------------------------

    getBuyers() {
        return this.axios.get<Buyer[]>("/buyers")
            .then(r => r.data)
            .catch(this.handleError); // 💥 Catch error
    }

    createBuyer(data: BuyerRequest) {
        return this.axios.post<Buyer>("/buyers", data)
            .then(r => r.data)
            .catch(this.handleError); // 💥 Catch error
    }

    getBuyer(id: string) {
        return this.axios.get<Buyer>(`/buyers/${id}`)
            .then(r => r.data)
            .catch(this.handleError); // 💥 Catch error
    }

    updateBuyer(id: string, data: BuyerRequest) {
        return this.axios.put<Buyer>(`/buyers/${id}`, data)
            .then(r => r.data)
            .catch(this.handleError); // 💥 Catch error
    }

    // --------------------------------------------------
    // PROJECTS
    // --------------------------------------------------

    // 💥 NEW: Added missing getter for all projects
    getProjects() {
        return this.axios.get<Project[]>("/projects")
            .then(r => r.data)
            .catch(this.handleError);
    }
    
    createProject(data: ProjectRequest) {
        return this.axios.post<Project>("/projects", data)
            .then(r => r.data)
            .catch(this.handleError);
    }

    getProject(id: string) {
        return this.axios.get<Project>(`/projects/${id}`)
            .then(r => r.data)
            .catch(this.handleError);
    }

    updateProject(id: string, data: ProjectRequest) {
        return this.axios.put<Project>(`/projects/${id}`, data)
            .then(r => r.data)
            .catch(this.handleError);
    }

    // --------------------------------------------------
    // VENDORS
    // --------------------------------------------------

    // ... (Vendor methods refactored to use .catch(this.handleError) ) ...

    createVendor(data: VendorRequest) {
        return this.axios.post<Vendor>("/vendors", data).then(r => r.data).catch(this.handleError);
    }

    getVendor(id: string) {
        return this.axios.get<Vendor>(`/vendors/${id}`).then(r => r.data).catch(this.handleError);
    }

    updateVendor(id: string, data: VendorRequest) {
        return this.axios.put<Vendor>(`/vendors/${id}`, data).then(r => r.data).catch(this.handleError);
    }

    getStatistics(vendor_id: string) {
        return this.axios.get<any>(`/statistics/compile/${vendor_id}`).then(r => r.data).catch(this.handleError);
    }

    // --------------------------------------------------
    // EMAILS
    // --------------------------------------------------

    // ... (Email methods refactored to use .catch(this.handleError) ) ...

    listEmails(params?: { vendorId?: string }) {
        return this.axios.get<Email[]>("/emails", { params }).then(r => r.data).catch(this.handleError);
    }

    createEmail(data: EmailRequest) {
        return this.axios.post<Email>("/emails", data).then(r => r.data).catch(this.handleError);
    }

    createEmailBulk(data: EmailRequest[]) {
        return this.axios.post<Email[]>("/emails/batch", data).then(r => r.data).catch(this.handleError);
    }

    getEmail(id: string) {
        return this.axios.get<Email>(`/emails/${id}`).then(r => r.data).catch(this.handleError);
    }

    updateEmail(id: string, data: EmailRequest) {
        return this.axios.put<Email>(`/emails/${id}`, data).then(r => r.data).catch(this.handleError);
    }

    sendEmail(data: EmailRequest) {
        return this.axios.post<{ success: boolean }>("/emails/send", data).then(r => r.data).catch(this.handleError);
    }

    // --------------------------------------------------
    // FORECASTER CHAT
    // --------------------------------------------------

    /**
     * Send a message to the AI Forecaster for negotiation insights
     */
    sendForecasterMessage(data: ForecasterRequest) {
        return this.axios.post<ForecasterResponse>("/forecaster/chat", data)
            .then(r => r.data)
            .catch(this.handleError);
    }

    /**
     * Get forecaster chat history for a vendor
     */
    getForecasterHistory(vendorId: string) {
        return this.axios.get<ForecasterResponse[]>(`/forecaster/history/${vendorId}`)
            .then(r => r.data)
            .catch(this.handleError);
    }
}