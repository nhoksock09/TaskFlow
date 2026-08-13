import { Component, inject, OnInit, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ConnectableUser,
  ConnectionRequestItem,
  MyConnectionItem
} from '@core/models';
import { ConnectionService } from '../../core/services/connection.service';
import { ToastService } from '../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-connections',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputText,
    Paginator,
    Select,
    Tag,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    TranslatePipe
  ],
  templateUrl: './connections.html',
  styleUrl: './connections.scss'
})
export class Connections implements OnInit {
  private connectionService = inject(ConnectionService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'search' | 'pending' | 'my-connections' = 'search';

  // --- Search & Connect tab ---
  searchQuery = '';
  appliedSearchQuery = '';
  searchResults: ConnectableUser[] = [];
  searchTotal = 0;
  searchPage = 1;
  searchPageSize = 5;
  isLoadingSearch = false;

  // --- Pending Requests tab ---
  incomingRequests: ConnectionRequestItem[] = [];
  outgoingRequests: ConnectionRequestItem[] = [];
  isLoadingPending = false;

  // --- My Connections tab ---
  connSearchQuery = '';
  appliedConnSearchQuery = '';
  myConnections: MyConnectionItem[] = [];
  connTotal = 0;
  connPage = 1;
  connPageSize = 5;
  isLoadingConnections = false;
  private connectionsLoaded = false;

  removeCandidate: MyConnectionItem | null = null;
  showRemoveModal = false;

  ngOnInit() {
    this.loadSearchResults();
    this.loadPendingRequests();
  }

  onTabChange(tab: string | number | undefined) {
    if (!tab) return;
    this.activeTab = tab as 'search' | 'pending' | 'my-connections';
    if (tab === 'my-connections' && !this.connectionsLoaded) {
      this.loadConnections();
    }
  }

  // ----- Search & Connect -----

  loadSearchResults() {
    this.isLoadingSearch = true;
    this.connectionService.searchUsers(this.appliedSearchQuery, this.searchPage, this.searchPageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.searchResults = res.data || [];
          this.searchTotal = res.total || 0;
          this.isLoadingSearch = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastService.error('CONNECTIONS.TOAST.LOAD_FAILED');
          this.isLoadingSearch = false;
        }
      });
  }

  onSearch() {
    this.appliedSearchQuery = this.searchQuery.trim();
    this.searchPage = 1;
    this.loadSearchResults();
  }

  onSearchPageChange(event: PaginatorState) {
    this.searchPage = (event.page ?? 0) + 1;
    this.searchPageSize = event.rows ?? this.searchPageSize;
    this.loadSearchResults();
  }

  onSearchPageSizeChange(newSize: number) {
    this.searchPageSize = newSize;
    this.searchPage = 1;
    this.loadSearchResults();
  }

  sendConnectionRequest(user: ConnectableUser) {
    this.connectionService.sendRequest(user._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.show('CONNECTIONS.TOAST.REQUEST_SENT', 'success', { name: user.name });
          this.loadSearchResults();
          this.loadPendingRequests();
        },
        error: () => this.toastService.error('CONNECTIONS.TOAST.REQUEST_FAILED')
      });
  }

  // ----- Pending Requests -----

  loadPendingRequests() {
    this.isLoadingPending = true;
    this.connectionService.getIncomingRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.incomingRequests = res.data || [];
          this.isLoadingPending = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastService.error('CONNECTIONS.TOAST.LOAD_FAILED');
          this.isLoadingPending = false;
        }
      });

    this.connectionService.getOutgoingRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.outgoingRequests = res.data || [];
          this.cdr.detectChanges();
        },
        error: () => this.toastService.error('CONNECTIONS.TOAST.LOAD_FAILED')
      });
  }

  acceptRequest(id: string, name?: string) {
    this.connectionService.acceptRequest(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.show('CONNECTIONS.TOAST.ACCEPT_SUCCESS', 'success', { name });
          this.loadPendingRequests();
          this.loadSearchResults();
          this.connectionsLoaded = false;
          if (this.activeTab === 'my-connections') {
            this.loadConnections();
          }
        },
        error: () => this.toastService.error('CONNECTIONS.TOAST.ACCEPT_FAILED')
      });
  }

  rejectRequest(id: string, name?: string) {
    this.connectionService.rejectRequest(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.show('CONNECTIONS.TOAST.REJECT_SUCCESS', 'success', { name });
          this.loadPendingRequests();
          this.loadSearchResults();
        },
        error: () => this.toastService.error('CONNECTIONS.TOAST.REJECT_FAILED')
      });
  }

  cancelOutgoingRequest(id: string, name?: string) {
    this.connectionService.removeConnection(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.show('CONNECTIONS.TOAST.CANCEL_SUCCESS', 'success', { name });
          this.loadPendingRequests();
          this.loadSearchResults();
        },
        error: () => this.toastService.error('CONNECTIONS.TOAST.CANCEL_FAILED')
      });
  }

  // ----- My Connections -----

  loadConnections() {
    this.isLoadingConnections = true;
    this.connectionService.getConnections(this.appliedConnSearchQuery, this.connPage, this.connPageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.myConnections = res.data || [];
          this.connTotal = res.total || 0;
          this.isLoadingConnections = false;
          this.connectionsLoaded = true;
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastService.error('CONNECTIONS.TOAST.LOAD_FAILED');
          this.isLoadingConnections = false;
        }
      });
  }

  onConnSearch() {
    this.appliedConnSearchQuery = this.connSearchQuery.trim();
    this.connPage = 1;
    this.loadConnections();
  }

  onConnPageChange(event: PaginatorState) {
    this.connPage = (event.page ?? 0) + 1;
    this.connPageSize = event.rows ?? this.connPageSize;
    this.loadConnections();
  }

  onConnPageSizeChange(newSize: number) {
    this.connPageSize = newSize;
    this.connPage = 1;
    this.loadConnections();
  }

  openRemoveModal(item: MyConnectionItem) {
    this.removeCandidate = item;
    this.showRemoveModal = true;
  }

  closeRemoveModal() {
    this.showRemoveModal = false;
    this.removeCandidate = null;
  }

  confirmRemoveConnection() {
    if (!this.removeCandidate) return;
    this.connectionService.removeConnection(this.removeCandidate.connectionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.show('CONNECTIONS.TOAST.REMOVE_SUCCESS', 'success', { name: this.removeCandidate?.user.name });
          this.closeRemoveModal();
          this.loadConnections();
          this.loadSearchResults();
        },
        error: () => this.toastService.error('CONNECTIONS.TOAST.REMOVE_FAILED')
      });
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '';
  }

  getAvatarBg(name: string): string {
    const colors = ['#3b82f6', '#10b981', '#6366f1', '#ec4899', '#f59e0b', '#8b5cf6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '--/--/----';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '--/--/----';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  }
}
