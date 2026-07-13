import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { ServiceRequestStage } from "@/types";
import { getStageProgress } from "@/lib/service-requests";
import type {
  FilterTab,
  RequestFile,
  RequestPriority,
  ServiceRequestItem
} from "./types";

export type ServiceRequestPersistence = {
  create: (
    item: Omit<
      ServiceRequestItem,
      "id" | "createdAt" | "comments" | "files" | "subTasks" | "starred" | "progress" | "clientId" | "createdBy"
    > & { progress?: number }
  ) => Promise<string>;
  update: (id: string, patch: Partial<ServiceRequestItem>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  uploadFile: (requestId: string, file: File) => Promise<RequestFile>;
};

type ServiceRequestStore = {
  items: ServiceRequestItem[];
  selectedId: string | null;
  activeTab: FilterTab;
  isAddSheetOpen: boolean;
  isDetailSheetOpen: boolean;
  filterUser: string[] | null;
  filterPriority: RequestPriority | null;
  showStarredOnly: boolean;
  searchQuery: string;
  persistence: ServiceRequestPersistence | null;

  setItems: (items: ServiceRequestItem[]) => void;
  setPersistence: (persistence: ServiceRequestPersistence | null) => void;
  addItem: (
    item: Omit<
      ServiceRequestItem,
      | "id"
      | "createdAt"
      | "comments"
      | "files"
      | "subTasks"
      | "starred"
      | "progress"
      | "clientId"
      | "createdBy"
    >
  ) => Promise<void>;
  updateItem: (id: string, patch: Partial<Omit<ServiceRequestItem, "id">>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  setSelectedId: (id: string | null) => void;
  setActiveTab: (tab: FilterTab) => void;
  setAddSheetOpen: (open: boolean) => void;
  setDetailSheetOpen: (open: boolean) => void;
  addComment: (id: string, text: string) => Promise<void>;
  deleteComment: (id: string, commentId: string) => Promise<void>;
  reorderItems: (positions: { id: string; position: number }[]) => void;
  setFilterUser: (users: string[] | null) => void;
  setFilterPriority: (priority: RequestPriority | null) => void;
  setSearchQuery: (query: string) => void;
  toggleShowStarredOnly: () => void;
  addFile: (id: string, file: File) => Promise<void>;
  removeFile: (id: string, fileId: string) => Promise<void>;
  addSubTask: (id: string, title: string) => Promise<void>;
  updateSubTask: (id: string, subTaskId: string, completed: boolean) => Promise<void>;
  removeSubTask: (id: string, subTaskId: string) => Promise<void>;
  toggleStarred: (id: string) => Promise<void>;
};

function withProgress<T extends { status?: ServiceRequestStage; progress?: number }>(patch: T): T {
  if (patch.status) {
    return { ...patch, progress: getStageProgress(patch.status) };
  }
  return patch;
}

export const useServiceRequestStore = create<ServiceRequestStore>((set, get) => ({
  items: [],
  selectedId: null,
  activeTab: "all",
  isAddSheetOpen: false,
  isDetailSheetOpen: false,
  filterUser: null,
  filterPriority: null,
  showStarredOnly: false,
  searchQuery: "",
  persistence: null,

  setItems: (items) => set({ items }),
  setPersistence: (persistence) => set({ persistence }),

  addItem: async (item) => {
    const persistence = get().persistence;
    if (!persistence) return;
    await persistence.create(item);
  },

  updateItem: async (id, patch) => {
    const persistence = get().persistence;
    const next = withProgress(patch);
    // Optimistic local update for snappy UI
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...next } : item))
    }));
    if (persistence) await persistence.update(id, next);
  },

  deleteItem: async (id) => {
    const persistence = get().persistence;
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
    if (persistence) await persistence.remove(id);
  },

  setSelectedId: (id) => set({ selectedId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAddSheetOpen: (open) => set({ isAddSheetOpen: open }),
  setDetailSheetOpen: (open) => set({ isDetailSheetOpen: open }),

  addComment: async (id, text) => {
    const item = get().items.find((entry) => entry.id === id);
    if (!item) return;
    const comments = [
      ...item.comments,
      { id: uuidv4(), text, createdAt: new Date() }
    ];
    await get().updateItem(id, { comments });
  },

  deleteComment: async (id, commentId) => {
    const item = get().items.find((entry) => entry.id === id);
    if (!item) return;
    await get().updateItem(id, {
      comments: item.comments.filter((comment) => comment.id !== commentId)
    });
  },

  reorderItems: (positions) =>
    set((state) => {
      const next = [...state.items];
      positions.forEach(({ id, position }) => {
        const index = next.findIndex((item) => item.id === id);
        if (index !== -1) {
          const [item] = next.splice(index, 1);
          next.splice(position, 0, item);
        }
      });
      return { items: next };
    }),

  setFilterUser: (users) => set({ filterUser: users }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleShowStarredOnly: () => set((state) => ({ showStarredOnly: !state.showStarredOnly })),

  addFile: async (id, file) => {
    const persistence = get().persistence;
    if (!persistence) return;
    const uploaded = await persistence.uploadFile(id, file);
    const item = get().items.find((entry) => entry.id === id);
    if (!item) return;
    await get().updateItem(id, { files: [...(item.files || []), uploaded] });
  },

  removeFile: async (id, fileId) => {
    const item = get().items.find((entry) => entry.id === id);
    if (!item) return;
    await get().updateItem(id, {
      files: (item.files || []).filter((file) => file.id !== fileId)
    });
  },

  addSubTask: async (id, title) => {
    const item = get().items.find((entry) => entry.id === id);
    if (!item) return;
    await get().updateItem(id, {
      subTasks: [...(item.subTasks || []), { id: uuidv4(), title, completed: false }]
    });
  },

  updateSubTask: async (id, subTaskId, completed) => {
    const item = get().items.find((entry) => entry.id === id);
    if (!item) return;
    await get().updateItem(id, {
      subTasks: (item.subTasks || []).map((subTask) =>
        subTask.id === subTaskId ? { ...subTask, completed } : subTask
      )
    });
  },

  removeSubTask: async (id, subTaskId) => {
    const item = get().items.find((entry) => entry.id === id);
    if (!item) return;
    await get().updateItem(id, {
      subTasks: (item.subTasks || []).filter((subTask) => subTask.id !== subTaskId)
    });
  },

  toggleStarred: async (id) => {
    const item = get().items.find((entry) => entry.id === id);
    if (!item) return;
    await get().updateItem(id, { starred: !item.starred });
  }
}));
