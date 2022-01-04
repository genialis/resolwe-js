import {Query} from './rest';

// ------------------------------------------------------------------
// Knowledge base

export interface Feature {
    id: string;
    source: string;
    feature_id: string;
    species: string;
    type: string;
    sub_type: string;
    name: string;
    full_name: string;
    description: string;
    aliases: string[];
}

export interface FeatureQuery {
    feature_id?: string;
    query?: string;
    type?: string;
    source?: string;
    species?: string;
}

export interface FeaturePasteQuery extends FeatureQuery {
    pasted: string[];
}

// ------------------------------------------------------------------
// File upload

// Stored file descriptor.
export interface FileDescriptor {
    file: string;
    is_remote?: boolean;
    file_temp?: string;
    notes?: string;
    size?: number;
    refs?: string[];
}

export interface FileUploadResponseItem {
    done: boolean;
    name: string;
    size: number;
    temp: string;
}

export interface FileUploadResponse {
    files: FileUploadResponseItem[];
}
