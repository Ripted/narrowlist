import { ITEMS_PER_PAGE } from "../utils";
import { AlertTriangle, ArrowUpDown, Check, ChevronDown, ChevronUp, ClipboardPaste, Edit2, GripVertical, Image, ImagePlus, List, ListCollapse, Loader2, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { extractLevelId } from "@/lib/extractLevelId";
import type { Level } from "../types";
import type { AdminState } from "../useAdminState";

export function LevelsTab({ a }: { a: AdminState }) {
  const {
    addLevel,
    addingLevel,
    b,
    confirmRankChange,
    confirmThumbnailChange,
    creators,
    currentPage,
    dragOverIndex,
    draggedIndex,
    file,
    filteredLevels,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    handleDrop,
    handleLevelIdPaste,
    handleQuickPasteMainThumbnail,
    handleQuickThumbnailUpload,
    items,
    level,
    levelSearchQuery,
    levels,
    manualCheckEmptyLevels,
    moveLevel,
    newLevelId,
    newLevelRank,
    openEditModal,
    paginatedLevels,
    rank,
    rankInputId,
    rankInputValue,
    saving,
    setCurrentPage,
    setDeleteConfirmLevel,
    setLevelSearchQuery,
    setMoveToExtraConfirm,
    setNewLevelId,
    setNewLevelRank,
    setRankInputId,
    setRankInputValue,
    setShowAll,
    setThumbnailEditId,
    setThumbnailInputValue,
    showAll,
    startRankEdit,
    syncing,
    target,
    thumbnailEditId,
    thumbnailInputValue,
    totalPages,
    uploadingThumbnail,
  } = a;
  return (
            <TabsContent value="levels" className="space-y-6">
              {/* Add New Level */}
              <div className="rounded-lg bg-card border border-border p-4 md:p-6">
                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Add New Level
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder="Enter level ID or paste link"
                    value={newLevelId}
                    onChange={(e) => setNewLevelId(extractLevelId(e.target.value))}
                    onPaste={(e) => handleLevelIdPaste(e, setNewLevelId)}
                    className="flex-1 bg-secondary border-border"
                  />
                  <Input
                    placeholder={`Rank (1-${levels.length + 1})`}
                    value={newLevelRank}
                    onChange={(e) => setNewLevelRank(e.target.value)}
                    className="w-full sm:w-32 bg-secondary border-border"
                    type="number"
                    min={1}
                    max={levels.length + 1}
                  />
                  <Button onClick={addLevel} disabled={addingLevel || !newLevelId.trim()}>
                    {addingLevel ? "Adding..." : "Add Level"}
                  </Button>
                </div>
              </div>

              {/* Level List */}
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-bold flex items-center gap-2">
                      <ArrowUpDown className="w-5 h-5 text-primary" />
                      Level Rankings
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
                        {filteredLevels.length}{levelSearchQuery ? ` of ${levels.length}` : ""} levels
                      </span>
                    </h2>
                    <div className="flex gap-2 flex-wrap">                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAll(!showAll)}
                        className="gap-1 text-xs"
                      >
                        {showAll ? <ListCollapse className="w-3 h-3" /> : <List className="w-3 h-3" />}
                        {showAll ? "Paginate" : "Show All"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={manualCheckEmptyLevels}
                        disabled={syncing}
                        className="gap-1 text-xs"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Check Empty
                      </Button>
                    </div>
                  </div>
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search levels by name, author, or ID..."
                      value={levelSearchQuery}
                      onChange={(e) => { setLevelSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="pl-9 bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                </div>

                {filteredLevels.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {levelSearchQuery ? "No matching levels found." : "No levels added yet."}
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-border">
                      {paginatedLevels.map((level, index) => {
                        const realIndex = showAll ? index : (currentPage - 1) * ITEMS_PER_PAGE + index;
                        return (
                          <div
                            key={level.id}
                            draggable
                            onDragStart={() => handleDragStart(realIndex)}
                            onDragOver={(e) => handleDragOver(e, realIndex)}
                            onDrop={() => handleDrop(realIndex)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 transition-all cursor-grab active:cursor-grabbing
                              ${draggedIndex === realIndex ? "opacity-50 bg-primary/10" : "hover:bg-secondary/20"}
                              ${dragOverIndex === realIndex && draggedIndex !== realIndex ? "border-t-2 border-primary" : ""}
                            `}
                          >
                            <div className="flex-shrink-0 text-muted-foreground hidden sm:block">
                              <GripVertical className="w-5 h-5" />
                            </div>

                            <div className="w-12 md:w-16 flex-shrink-0">
                              {rankInputId === level.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min={1}
                                    max={levels.length}
                                    value={rankInputValue}
                                    onChange={(e) => setRankInputValue(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); (e.target as HTMLInputElement).blur(); setTimeout(() => confirmRankChange(), 50); } }}
                                    className="w-12 h-8 text-center p-1 bg-secondary"
                                    autoFocus
                                  />
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={confirmRankChange}>
                                    <Check className="w-3 h-3 text-green-500" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRankInputId(null)}>
                                    <X className="w-3 h-3 text-destructive" />
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startRankEdit(level)}
                                  className="font-display font-bold text-lg text-foreground hover:text-primary transition-colors"
                                  title="Click to change rank"
                                >
                                  #{level.rank_position}
                                </button>
                              )}
                            </div>

                            <div className="w-16 md:w-20 h-10 md:h-12 rounded bg-secondary overflow-hidden flex-shrink-0 relative group">
                              {uploadingThumbnail === level.id ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                </div>
                              ) : thumbnailEditId === level.id ? (
                                <div className="absolute inset-0 bg-card p-1 flex items-center gap-1 z-10">
                                  <Input
                                    type="text"
                                    placeholder="URL..."
                                    value={thumbnailInputValue}
                                    onChange={(e) => setThumbnailInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && confirmThumbnailChange()}
                                    className="h-full text-xs p-1 bg-secondary flex-1"
                                    autoFocus
                                  />
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={confirmThumbnailChange}>
                                    <Check className="w-3 h-3 text-green-500" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setThumbnailEditId(null)}>
                                    <X className="w-3 h-3 text-destructive" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id={`thumb-upload-${level.id}`}
                                    onChange={(e) => handleQuickThumbnailUpload(e, level.id)}
                                  />
                                  <div className="w-full h-full relative">
                                    {level.thumbnail_url ? (
                                      <img
                                        src={level.thumbnail_url}
                                        alt={level.name || "Level"}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Image className="w-4 h-4 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                                      <button
                                        onClick={() => document.getElementById(`thumb-upload-${level.id}`)?.click()}
                                        className="p-1 rounded bg-primary/80 hover:bg-primary"
                                        title="Upload image"
                                      >
                                        <ImagePlus className="w-3 h-3 text-primary-foreground" />
                                      </button>
                                      <button
                                        onClick={() => handleQuickPasteMainThumbnail(level.id)}
                                        className="p-1 rounded bg-secondary/80 hover:bg-secondary"
                                        title="Paste image from clipboard"
                                      >
                                        <ClipboardPaste className="w-3 h-3 text-foreground" />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground truncate text-sm md:text-base">
                                {level.name || "Unnamed Level"}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {(level.creators && level.creators.length > 0
                                  ? level.creators.join(", ")
                                  : level.author) || "Unknown"} • {level.points} pts
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveLevel(realIndex, "up")}
                                disabled={realIndex === 0 || saving}
                                className="h-8 w-8 hidden sm:flex"
                                title="Move up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveLevel(realIndex, "down")}
                                disabled={realIndex === levels.length - 1 || saving}
                                className="h-8 w-8 hidden sm:flex"
                                title="Move down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModal(level)}
                                className="h-8 w-8"
                                title="Edit details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMoveToExtraConfirm(level)}
                                className="h-8 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
                                title="Move to Extra List"
                              >
                                <ArrowUpDown className="w-3 h-3" />
                                Extra
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirmLevel(level)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Remove level"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Pagination */}
                    {!showAll && totalPages > 1 && (
                      <div className="p-4 border-t border-border flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
  );
}
