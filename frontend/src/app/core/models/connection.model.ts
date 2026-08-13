import { BaseDocument } from './common.model';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';
export type ConnectionRelationStatus = 'none' | 'pending-outgoing' | 'pending-incoming' | 'accepted';

export interface Connection extends BaseDocument {
  requester: string;
  recipient: string;
  status: ConnectionStatus;
  respondedAt?: string | null;
}

export interface ConnectableUser {
  _id: string;
  name: string;
  email: string;
  dateOfBirth?: string;
  connectionStatus: ConnectionRelationStatus;
  connectionId?: string;
}

export interface ConnectionSearchResponse {
  success: boolean;
  data: ConnectableUser[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ConnectionRequestUser {
  _id: string;
  name: string;
  email: string;
  dateOfBirth?: string;
}

export interface ConnectionRequestItem {
  _id: string;
  status: ConnectionStatus;
  createdAt: string;
  requester?: ConnectionRequestUser;
  recipient?: ConnectionRequestUser;
}

export interface ConnectionRequestListResponse {
  success: boolean;
  data: ConnectionRequestItem[];
  total: number;
}

export interface MyConnectionItem {
  connectionId: string;
  user: ConnectionRequestUser;
  connectedSince: string;
}

export interface MyConnectionsResponse {
  success: boolean;
  data: MyConnectionItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ConnectionActionResponse {
  success: boolean;
  message: string;
  data?: Connection;
}
