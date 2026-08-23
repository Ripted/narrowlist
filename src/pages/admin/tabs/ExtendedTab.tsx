import { ArrowUpDown, Check, ChevronDown, ChevronUp, ClipboardPaste, Edit2, Image, ImagePlus, List, Loader2, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { extractLevelId } from "@/lib/extractLevelId";
import type { Level } from "../types";
import type { AdminState } from "../useAdminState";

export function ExtendedTab({ a }: { a: AdminState }) {
  const {
    addExtendedLevel,
    addingExtendedLevel,
    b,
    confirmExtendedRankChange,
    creators,
    deleteExtendedLevel,
    extendedLevelPreview,
    extendedLevels,
    extendedRankInputId,
    extendedRankInputValue,
    extendedSearchQuery,
    fetchExtendedLevelPreview,
    fetchingExtendedLevelInfo,
    file,
    filteredExtendedLevels,
    handleLevelIdPaste,
    handleQuickExtendedThumbnailUpload,
    handleQuickPasteExtendedThumbnail,
    items,
    level,
    levels,
    moveExtendedLevel,
    newExtendedLevelId,
    newExtendedLevelRank,
    openEditExtendedLevel,
    rank,
    setExtendedRankInputId,
    setExtendedRankInputValue,
    setExtendedSearchQuery,
    setMoveToMainConfirm,
    setNewExtendedLevelId,
    setNewExtendedLevelRank,
    startExtendedRankEdit,
    target,
    uploadingExtendedRowThumb,
  } = a;
  return (
            <TabsContent value="extended" className="space-y-6">
              {/* Add New Extra Level */}
              <div className="rounded-lg bg-card border border-border p-4 md:p-6">
                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Add New Extra Level
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter level ID or paste link"
                      value={newExtendedLevelId}
                      onChange={(e) => setNewExtendedLevelId(extractLevelId(e.target.value))}
                      onPaste={(e) => handleLevelIdPaste(e, setNewExtendedLevelId, fetchExtendedLevelPreview)}
                      onBlur={() => fetchExtendedLevelPreview(newExtendedLevelId)}
                      className="bg-secondary border-border"
                    />
                    {fetchingExtendedLevelInfo && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Fetching level info...
                      </p>
                    )}
                    {extendedLevelPreview && (
                      <p className="text-xs text-primary mt-1">
                        ✓ {extendedLevelPreview.name} by {extendedLevelPreview.author}
                      </p>
                    )}
                  </div>
                  <Input
                    placeholder={`Rank (1-${extendedLevels.length + 1})`}
                    value={newExtendedLevelRank}
                    onChange={(e) => setNewExtendedLevelRank(e.target.value)}
                    className="w-full sm:w-32 bg-secondary border-border"
                    type="number"
                    min={1}
                    max={extendedLevels.length + 1}
                  />
                  <Button onClick={addExtendedLevel} disabled={addingExtendedLevel || !newExtendedLevelId.trim()}>
                    {addingExtendedLevel ? "Adding..." : "Add Level"}
                  </Button>
                </div>
              </div>

              {/* Extra Level List */}
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-bold flex items-center gap-2">
                      <ArrowUpDown className="w-5 h-5 text-primary" />
                      Extra List Rankings
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
                        {filteredExtendedLevels.length}{extendedSearchQuery ? ` of ${extendedLevels.length}` : ""} levels
                      </span>
                    </h2>
                    <div className="flex gap-2 flex-wrap">                    </div>
                  </div>
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search levels by name, author, or ID..."
                      value={extendedSearchQuery}
                      onChange={(e) => setExtendedSearchQuery(e.target.value)}
                      className="pl-9 bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                </div>

                {filteredExtendedLevels.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {extendedSearchQuery ? "No matching levels found." : "No extra levels yet."}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredExtendedLevels.map((level) => {
                      const actualIndex = extendedLevels.findIndex((l) => l.id === level.id);
                      return (
                        <div
                          key={level.id}
                          className="flex items-center gap-2 md:gap-3 p-3 md:p-4 transition-all hover:bg-secondary/20"
                        >
                          <div className="w-12 md:w-16 flex-shrink-0">
                            {extendedRankInputId === level.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min={1}
                                  max={extendedLevels.length}
                                  value={extendedRankInputValue}
                                  onChange={(e) => setExtendedRankInputValue(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); (e.target as HTMLInputElement).blur(); setTimeout(() => confirmExtendedRankChange(), 50); } }}
                                  className="w-12 h-8 text-center p-1 bg-secondary"
                                  autoFocus
                                />
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={confirmExtendedRankChange}>
                                  <Check className="w-3 h-3 text-green-500" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setExtendedRankInputId(null)}>
                                  <X className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startExtendedRankEdit(level)}
                                className="font-display font-bold text-lg text-foreground hover:text-primary transition-colors"
                                title="Click to change rank"
                              >
                                #{level.rank_position}
                              </button>
                            )}
                          </div>

                          <div className="w-16 md:w-20 h-10 md:h-12 rounded bg-secondary overflow-hidden flex-shrink-0 relative group">
                            {uploadingExtendedRowThumb === level.id ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              </div>
                            ) : (
                              <>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id={`extra-thumb-upload-${level.id}`}
                                  onChange={(e) => handleQuickExtendedThumbnailUpload(e, level.id)}
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
                                      onClick={() => document.getElementById(`extra-thumb-upload-${level.id}`)?.click()}
                                      className="p-1 rounded bg-primary/80 hover:bg-primary"
                                      title="Upload image"
                                    >
                                      <ImagePlus className="w-3 h-3 text-primary-foreground" />
                                    </button>
                                    <button
                                      onClick={() => handleQuickPasteExtendedThumbnail(level.id)}
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
                              onClick={() => moveExtendedLevel(actualIndex, "up")}
                              disabled={actualIndex === 0}
                              className="h-8 w-8 hidden sm:flex"
                              title="Move up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveExtendedLevel(actualIndex, "down")}
                              disabled={actualIndex === extendedLevels.length - 1}
                              className="h-8 w-8 hidden sm:flex"
                              title="Move down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditExtendedLevel(level)}
                              className="h-8 w-8"
                              title="Edit details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMoveToMainConfirm(level)}
                              className="h-8 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
                              title="Move to Main List"
                            >
                              <ArrowUpDown className="w-3 h-3" />
                              Main
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteExtendedLevel(level)}
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
                )}
              </div>
            </TabsContent>
  );
}
