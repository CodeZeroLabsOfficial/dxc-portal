"use client";

import React from "react";

import { useServiceRequestStore } from "../store";
import RequestList from "./request-list";
import AddRequestSheet from "./add-request-sheet";
import RequestDetailSheet from "./request-detail-sheet";

export default function RequestsBoard() {
  const {
    activeTab,
    isAddSheetOpen,
    setAddSheetOpen,
    isDetailSheetOpen,
    setDetailSheetOpen,
    selectedId,
    setSelectedId
  } = useServiceRequestStore();

  const [editId, setEditId] = React.useState<string | null>(null);

  const handleAddClick = () => {
    setEditId(null);
    setAddSheetOpen(true);
  };

  const handleEditClick = (id: string) => {
    setEditId(id);
    setAddSheetOpen(true);
  };

  const handleSelectItem = (id: string) => {
    setSelectedId(id);
    setDetailSheetOpen(true);
  };

  const handleCloseAddSheet = () => {
    setAddSheetOpen(false);
    setEditId(null);
  };

  const handleCloseDetailSheet = () => {
    setDetailSheetOpen(false);
    setSelectedId(null);
  };

  return (
    <div className="space-y-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Service Requests</h1>
      </header>

      <RequestList
        activeTab={activeTab}
        onSelectItem={handleSelectItem}
        onAddClick={handleAddClick}
      />

      <AddRequestSheet isOpen={isAddSheetOpen} onClose={handleCloseAddSheet} editId={editId} />

      <RequestDetailSheet
        isOpen={isDetailSheetOpen}
        onClose={handleCloseDetailSheet}
        requestId={selectedId}
        onEditClick={(id) => {
          handleCloseDetailSheet();
          handleEditClick(id);
        }}
      />
    </div>
  );
}
