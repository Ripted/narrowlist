import { Check, ChevronDown, ChevronUp, ClipboardPaste, Edit2, GripVertical, Hourglass, Image, ImagePlus, List, ListCollapse, Loader2, Search, Shield, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { extractLevelId } from "@/lib/extractLevelId";
import { formatFutureRank } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "../utils";
import type { Level } from "../types";
import type { AdminState } from "../useAdminState";

export function FutureTab({ a }: { a: AdminState }) {
  const {
    addFutureLevel,
    addingFutureLevel,
    checkVerifiedFutureLevels,
    confirmFutureRankChange,
    confirmFutureThumbnailChange,
    filteredFutureLevels,
    futureLevels,
    futureCurrentPage,
    futureRankGroupSizes,
    futureTotalPages,
    paginatedFutureLevels,
    showAllFuture,
    handleFutureDragStart,
    handleFutureDragOver,
    handleFutureDrop,
    handleFutureDragEnd,
    dragOverFutureIndex,
    draggedFutureIndex,
    setFutureCurrentPage,
    setShowAllFuture,
    futureRankInputId,
    futureRankInputValue,
    futureSearchQuery,
    futureThumbnailEditId,
    futureThumbnailInputValue,
    handleLevelIdPaste,
    handleQuickFutureThumbnailUpload,
    handleQuickPasteFutureThumbnail,
    levels,
    moveFutureLevel,
    newFutureLevelId,
    newFutureLevelRank,
    openEditFutureLevel,
    savingFuture,
    setDeleteConfirmFutureLevel,
    setFutureRankInputId,
    setFutureRankInputValue,
    setFutureSearchQuery,
    setFutureThumbnailEditId,
    setFutureThumbnailInputValue,
    setNewFutureLevelId,
    setNewFutureLevelRank,
    startFutureRankEdit,
    syncing,
    uploadingFutureRowThumbnail,
  } = a;
  return (
            <TabsContent value="future" className="space-y-6">
              {/* Add Future Level */}
              <div className="rounded-lg bg-card border border-border p-4 md:p-6">
                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <Hourglass className="w-5 h-5 text-primary" />
                  Add Future Level
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder="Enter level ID or paste link"
                    value={newFutureLevelId}
                    onChange={(e) => setNewFutureLevelId(extractLevelId(e.target.value))}
                    onPaste={(e) => handleLevelIdPaste(e, setNewFutureLevelId)}
                    className="flex-1 bg-secondary border-border"
                  />
                  <Input
                    placeholder="Estimated Rank"
                    value={newFutureLevelRank}
                    onChange={(e) => setNewFutureLevelRank(e.target.value)}
                    className="w-full sm:w-32 bg-secondary border-border"
                    type="number"
                    min={1}
                  />
                  <Button onClick={addFutureLevel} disabled={addingFutureLevel || !newFutureLevelId.trim()}>
                    {addingFutureLevel ? "Adding..." : "Add Level"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Future levels are unbeaten levels. Use "Check Verified Levels" to automatically move verified levels to the main list.
                </p>
              </div>

              {/* Future Level List */}
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-bold flex items-center gap-2">
                      <Hourglass className="w-5 h-5 text-primary" />
                      Future Levels
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
                        {filteredFutureLevels.length}{futureSearchQuery ? ` of ${futureLevels.length}` : ""} levels
                      </span>
                    </h2>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllFuture(!showAllFuture)}
                        className="gap-1 text-xs"
                      >
                        {showAllFuture ? <ListCollapse className="w-3 h-3" /> : <List className="w-3 h-3" />}
                        {showAllFuture ? "Paginate" : "Show All"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={checkVerifiedFutureLevels}
                        disabled={syncing}
                        className="gap-1 text-xs"
                      >
                        <Shield className="w-3 h-3" />
                        Check Verified Levels
                      </Button>
                    </div>
                  </div>
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search future levels..."
                      value={futureSearchQuery}
                      onChange={(e) => { setFutureSearchQuery(e.target.value); setFutureCurrentPage(1); }}
                      className="pl-9 bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                </div>

                {filteredFutureLevels.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {futureSearchQuery ? "No matching future levels found." : "No future levels added yet."}
                  </div>
                ) : (
                  <>
                  <div className="divide-y divide-border">
                    {paginatedFutureLevels.map((level, index) => {
                      const realIndex = showAllFuture ? index : (futureCurrentPage - 1) * ITEMS_PER_PAGE + index;
                      return (
                      <div
                        key={level.id}
                        draggable={!futureSearchQuery}
                        onDragStart={() => handleFutureDragStart(realIndex)}
                        onDragOver={(e) => handleFutureDragOver(e, realIndex)}
                        onDrop={() => handleFutureDrop(realIndex)}
                        onDragEnd={handleFutureDragEnd}
                        className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 transition-all cursor-grab active:cursor-grabbing
                          ${draggedFutureIndex === realIndex ? "opacity-50 bg-primary/10" : "hover:bg-secondary/20"}
                          ${dragOverFutureIndex === realIndex && draggedFutureIndex !== realIndex ? "border-t-2 border-primary" : ""}
                        `}
                      >
                        <div className="flex-shrink-0 text-muted-foreground hidden sm:block">
                          <GripVertical className="w-5 h-5" />
                        </div>

                        <div className="w-12 md:w-16 flex-shrink-0">
                          {futureRankInputId === level.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={futureRankInputValue}
                                onChange={(e) => setFutureRankInputValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); (e.target as HTMLInputElement).blur(); setTimeout(() => confirmFutureRankChange(), 50); } }}
                                className="w-16 h-8 text-center p-1 bg-secondary"
                                title="Rank, or rank.sub to place inside a tied group (e.g. 5.2)"
                                autoFocus
                              />
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={confirmFutureRankChange}>
                                <Check className="w-3 h-3 text-green-500" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setFutureRankInputId(null)}>
                                <X className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startFutureRankEdit(level)}
                              className="font-display font-bold text-lg text-foreground hover:text-primary transition-colors"
                              title="Click to change rank"
                            >
                              {formatFutureRank(level.rank_position, level.sub_rank, futureRankGroupSizes.get(level.rank_position) ?? 1)}
                            </button>
                          )}
                        </div>

                        <div className="w-16 md:w-20 h-10 md:h-12 rounded bg-secondary overflow-hidden flex-shrink-0 relative group">
                          {uploadingFutureRowThumbnail === level.id ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            </div>
                          ) : futureThumbnailEditId === level.id ? (
                            <div className="absolute inset-0 bg-card p-1 flex items-center gap-1 z-10">
                              <Input
                                type="text"
                                placeholder="URL..."
                                value={futureThumbnailInputValue}
                                onChange={(e) => setFutureThumbnailInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && confirmFutureThumbnailChange()}
                                className="h-full text-xs p-1 bg-secondary flex-1"
                                autoFocus
                              />
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={confirmFutureThumbnailChange}>
                                <Check className="w-3 h-3 text-green-500" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setFutureThumbnailEditId(null)}>
                                <X className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`future-thumb-upload-${level.id}`}
                                onChange={(e) => handleQuickFutureThumbnailUpload(e, level.id)}
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
                                    onClick={() => document.getElementById(`future-thumb-upload-${level.id}`)?.click()}
                                    className="p-1 rounded bg-primary/80 hover:bg-primary"
                                    title="Upload image"
                                  >
                                    <ImagePlus className="w-3 h-3 text-primary-foreground" />
                                  </button>
                                  <button
                                    onClick={() => handleQuickPasteFutureThumbnail(level.id)}
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
                            onClick={() => moveFutureLevel(realIndex, "up")}
                            disabled={realIndex === 0 || savingFuture || !!futureSearchQuery.trim()}
                            className="h-8 w-8 hidden sm:flex"
                            title={futureSearchQuery.trim() ? "Clear search to reorder" : "Move up"}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveFutureLevel(realIndex, "down")}
                            disabled={realIndex === filteredFutureLevels.length - 1 || savingFuture || !!futureSearchQuery.trim()}
                            className="h-8 w-8 hidden sm:flex"
                            title={futureSearchQuery.trim() ? "Clear search to reorder" : "Move down"}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditFutureLevel(level)}
                            className="h-8 w-8"
                            title="Edit details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmFutureLevel(level)}
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
                  {!showAllFuture && futureTotalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFutureCurrentPage(p => Math.max(1, p - 1))}
                        disabled={futureCurrentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {futureCurrentPage} of {futureTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFutureCurrentPage(p => Math.min(futureTotalPages, p + 1))}
                        disabled={futureCurrentPage === futureTotalPages}
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
