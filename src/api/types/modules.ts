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
    feature_id: string;
    source: string;
}

export interface FeaturesQuery {
    feature_id: string[];
    source: string;
}

export interface FeatureSearchQuery extends Query {
    query: string | string[];
    source?: string;
}

export interface FeatureAutocompleteQuery extends FeatureSearchQuery {
    query: string;
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
