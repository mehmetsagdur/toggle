import axios from 'axios';

export const api = axios.create({
    baseURL: '/api/backend',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        if (tenantId) {
            config.headers['x-tenant-id'] = tenantId;
        }
    }
    return config;
});

export enum Environment {
    DEV = 'DEV',
    STAGING = 'STAGING',
    PROD = 'PROD',
}

export enum StrategyType {
    BOOLEAN = 'BOOLEAN',
    PERCENTAGE = 'PERCENTAGE',
    USER_TARGETING = 'USER_TARGETING',
}

export interface Feature {
    id: string;
    key: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    flags?: FeatureFlag[];
}

export interface FeatureFlag {
    id: string;
    env: Environment;
    enabled: boolean;
    strategyType: StrategyType;
    strategyConfig?: unknown;
    version: number;
    createdAt: string;
    updatedAt: string;
}

export interface PromoteFeaturesDto {
    sourceEnv: Environment;
    targetEnv: Environment;
    dryRun?: boolean;
    featureKeys?: string[];
}

export interface PromotionResultDto {
    sourceEnv: Environment;
    targetEnv: Environment;
    dryRun: boolean;
    stats: {
        featuresScanned: number;
        flagsCreated: number;
        flagsUpdated: number;
        flagsSkipped: number;
    };
    changes: Array<{
        featureKey: string;
        action: 'CREATE' | 'UPDATE' | 'SKIP';
        diff?: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
    }>;
}

export interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    actorId: string;
    createdAt: string;
    beforeState?: Record<string, unknown> | null;
    afterState?: Record<string, unknown> | null;
}

export const FeaturesApi = {
    list: async (params?: { page?: number; limit?: number; search?: string }) => {
        const res = await api.get<{ data: Feature[]; total: number; page: number; limit: number }>('/features', { params });
        return res.data;
    },

    get: async (id: string) => {
        const res = await api.get<Feature>(`/features/${id}`);
        return res.data;
    },

    create: async (data: { key: string; name: string; description?: string }) => {
        const res = await api.post<Feature>('/features', data);
        return res.data;
    },

    update: async (id: string, data: { name?: string; description?: string }) => {
        const res = await api.patch<Feature>(`/features/${id}`, data);
        return res.data;
    },

    delete: async (id: string) => {
        await api.delete(`/features/${id}`);
    },

    promote: async (data: PromoteFeaturesDto) => {
        const res = await api.post<PromotionResultDto>('/features/promote', data);
        return res.data;
    },
};

export const FlagsApi = {
    list: async (featureId: string) => {
        const res = await api.get<FeatureFlag[]>(`/features/${featureId}/flags`);
        return res.data;
    },

    create: async (featureId: string, data: { env: Environment; enabled: boolean; strategyType: StrategyType; strategyConfig?: unknown }) => {
        const res = await api.post<FeatureFlag>(`/features/${featureId}/flags`, data);
        return res.data;
    },

    update: async (featureId: string, env: Environment, data: { enabled?: boolean; strategyType?: StrategyType; strategyConfig?: unknown }) => {
        const res = await api.patch<FeatureFlag>(`/features/${featureId}/flags/${env}`, data);
        return res.data;
    },

    delete: async (featureId: string, env: Environment) => {
        await api.delete(`/features/${featureId}/flags/${env}`);
    }
};

export const AuditLogsApi = {
    list: async (params?: { page?: number; limit?: number; action?: string }) => {
        const res = await api.get<{ data: AuditLog[]; total: number; page: number; limit: number }>('/audit-logs', { params });
        return res.data;
    }
};
