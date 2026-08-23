import { isVideoUrl } from "./utils";
import { AlertTriangle, ArrowUpDown, ChevronDown, ChevronUp, Clipboard, Edit2, ExternalLink, FileVideo, Image, ImagePlus, List, Loader2, MessageSquare, Play, Upload, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Level, Profile } from "./types";
import type { AdminState } from "./useAdminState";

export function AdminDialogs({ a }: { a: AdminState }) {
  const {
    addManualRunOpen,
    addingManualRun,
    allProfiles,
    confirmDeleteLevel,
    creators,
    data,
    deleteConfirmFutureLevel,
    deleteConfirmLevel,
    deleteConfirmManualRun,
    deleteConfirmRater,
    deleteFutureLevel,
    deleteManualRun,
    displaySubmitter,
    editAlternativeIds,
    editAuthor,
    editCreators,
    editDescription,
    editExtendedAlternativeIds,
    editExtendedAuthor,
    editExtendedCreators,
    editExtendedDescription,
    editExtendedName,
    editExtendedRank,
    editExtendedThumbnail,
    editExtendedThumbnailInputRef,
    editExtendedVerifier,
    editFutureAuthor,
    editFutureDescription,
    editFutureName,
    editFuturePoints,
    editFutureRank,
    editFutureThumbnail,
    editFutureThumbnailInputRef,
    editName,
    editThumbnail,
    editThumbnailInputRef,
    editVerifier,
    editingExtendedLevel,
    editingFutureLevel,
    editingLevel,
    editingManualRun,
    executeExtendedRankChange,
    executeRankChange,
    extendedLevels,
    extendedRankConfirmLevel,
    file,
    handleEditThumbnailUpload,
    handleExtendedThumbnailUpload,
    handleFutureThumbnailUpload,
    handlePasteExtendedThumbnail,
    handlePasteFutureThumbnail,
    handlePasteMainThumbnail,
    handleRunSubmissionReview,
    handleSubmissionReview,
    hardDeleteConfirmOpen,
    hardDeleteProfile,
    hardDeleteSelectedId,
    hardDeleting,
    items,
    leaderboard,
    level,
    levels,
    manualRunArrow,
    manualRunDate,
    manualRunLevel,
    manualRunListType,
    manualRunNote,
    manualRunProfile,
    manualRunProofInputRef,
    manualRunProofUrl,
    manualRunTime,
    manualRunVerifier,
    mergeConfirmOpen,
    mergeDisplayName,
    mergeProfiles,
    mergeSourceProfile,
    mergeTargetProfile,
    mergingProfiles,
    moveToExtraConfirm,
    moveToMainConfirm,
    pendingExtendedRank,
    pendingNewRank,
    processingRunSubmission,
    processingSubmission,
    profile,
    rank,
    rankConfirmLevel,
    removeLevelRater,
    reviewingRunSubmission,
    reviewingSubmission,
    runSubmissionArrow,
    runSubmissionDate,
    runSubmissionNote,
    runSubmissionTime,
    saveEditedExtendedLevel,
    saveEditedFutureLevel,
    saveEditedLevel,
    saveManualRun,
    saving,
    savingExtendedLevel,
    savingFutureLevel,
    setAddManualRunOpen,
    setDeleteConfirmFutureLevel,
    setDeleteConfirmLevel,
    setDeleteConfirmManualRun,
    setDeleteConfirmRater,
    setEditAlternativeIds,
    setEditAuthor,
    setEditCreators,
    setEditDescription,
    setEditExtendedAlternativeIds,
    setEditExtendedAuthor,
    setEditExtendedCreators,
    setEditExtendedDescription,
    setEditExtendedName,
    setEditExtendedRank,
    setEditExtendedThumbnail,
    setEditExtendedVerifier,
    setEditFutureAuthor,
    setEditFutureDescription,
    setEditFutureName,
    setEditFuturePoints,
    setEditFutureRank,
    setEditFutureThumbnail,
    setEditName,
    setEditThumbnail,
    setEditVerifier,
    setEditingExtendedLevel,
    setEditingFutureLevel,
    setEditingLevel,
    setExtendedRankConfirmLevel,
    setHardDeleteConfirmOpen,
    setManualRunArrow,
    setManualRunDate,
    setManualRunLevel,
    setManualRunListType,
    setManualRunNote,
    setManualRunProfile,
    setManualRunProofUrl,
    setManualRunTime,
    setManualRunVerifier,
    setMergeConfirmOpen,
    setMoveToExtraConfirm,
    setMoveToMainConfirm,
    setPendingExtendedRank,
    setPendingNewRank,
    setRankConfirmLevel,
    setReviewingRunSubmission,
    setReviewingSubmission,
    setRunSubmissionArrow,
    setRunSubmissionDate,
    setRunSubmissionNote,
    setRunSubmissionTime,
    setSubmissionNote,
    setSubmissionRank,
    setSubmissionTargetList,
    submission,
    submissionNote,
    submissionRank,
    submissionTargetList,
    syncing,
    target,
    transferExtendedToMain,
    transferMainToExtended,
    updateRunSubmission,
    uploadProofScreenshot,
    uploadingExtendedThumbnail,
    uploadingFutureThumbnail,
    uploadingProof,
    username,
  } = a;
  return (
    <>

{/* Add/Edit Manual Run Modal */}
      {addManualRunOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg space-y-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              {editingManualRun ? "Edit Manual Run" : "Add Manual Run"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label>List Type *</Label>
                <Select value={manualRunListType} onValueChange={(v) => {
                  setManualRunListType(v as "main" | "extra");
                  setManualRunLevel(""); // Reset level when switching lists
                }}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main List</SelectItem>
                    <SelectItem value="extra">Extra List</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Level *</Label>
                <Select value={manualRunLevel} onValueChange={setManualRunLevel}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue placeholder="Select a level" />
                  </SelectTrigger>
                  <SelectContent>
                    {manualRunListType === "main" ? (
                      levels.map(level => (
                        <SelectItem key={level.id} value={level.id}>
                          #{level.rank_position} - {level.name || level.level_id}
                        </SelectItem>
                      ))
                    ) : (
                      extendedLevels.map(level => (
                        <SelectItem key={level.id} value={level.id}>
                          #{level.rank_position} - {level.name || level.level_id} (Extra)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Player *</Label>
                <Select value={manualRunProfile} onValueChange={setManualRunProfile}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue placeholder="Select a player" />
                  </SelectTrigger>
                  <SelectContent>
                    {allProfiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.display_name || profile.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Time (seconds) *</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={manualRunTime}
                    onChange={(e) => setManualRunTime(e.target.value)}
                    placeholder="123.456"
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={manualRunDate}
                    onChange={(e) => setManualRunDate(e.target.value)}
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
              </div>

              <div>
                <Label>Arrow</Label>
                <Select value={manualRunArrow} onValueChange={setManualRunArrow}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Energy Arrow">Energy Arrow</SelectItem>
                    <SelectItem value="Speedy Arrow">Speedy Arrow</SelectItem>
                    <SelectItem value="Narrow Arrow">Narrow Arrow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="manualRunVerifier"
                  checked={manualRunVerifier}
                  onChange={(e) => setManualRunVerifier(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="manualRunVerifier">This is the verifier run</Label>
              </div>

              <div>
                <Label>Note (shown in leaderboard)</Label>
                <Input
                  value={manualRunNote}
                  onChange={(e) => setManualRunNote(e.target.value)}
                  placeholder="e.g., 'Time no longer visible on official leaderboards'"
                  className="mt-1 bg-secondary border-border"
                />
              </div>

              <div>
                <Label>Proof (Screenshot or Video URL)</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paste an image URL, video URL (YouTube / Twitch / Streamable / .mp4), or upload a screenshot.
                </p>
                <div className="mt-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={manualRunProofInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadProofScreenshot(file);
                      e.target.value = '';
                    }}
                  />
                  {manualRunProofUrl ? (
                    <div className="relative">
                      {isVideoUrl(manualRunProofUrl) ? (
                        <div className="w-full h-32 rounded-lg border border-border bg-secondary flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <FileVideo className="w-5 h-5" />
                          <span className="truncate max-w-[80%]">{manualRunProofUrl}</span>
                        </div>
                      ) : (
                        <img src={manualRunProofUrl} alt="Proof" className="w-full h-32 object-cover rounded-lg border border-border" />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setManualRunProofUrl("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => manualRunProofInputRef.current?.click()}
                      disabled={uploadingProof}
                      className="w-full gap-2"
                    >
                      {uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                      {uploadingProof ? "Uploading..." : "Upload Proof Screenshot"}
                    </Button>
                  )}
                  <Input
                    value={manualRunProofUrl}
                    onChange={(e) => setManualRunProofUrl(e.target.value)}
                    placeholder="Or paste image / video URL..."
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setAddManualRunOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveManualRun} disabled={addingManualRun}>
                {addingManualRun ? "Saving..." : editingManualRun ? "Update Run" : "Add Run"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - with scroll support for tags at bottom */}
      {editingLevel && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditingLevel(null)}>
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 my-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold">Edit Level</h2>
            
            <div className="aspect-video rounded-lg bg-secondary overflow-hidden relative group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={editThumbnailInputRef}
                onChange={handleEditThumbnailUpload}
              />
              {editThumbnail ? (
                <img src={editThumbnail} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Image className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => editThumbnailInputRef.current?.click()}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  Upload
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePasteMainThumbnail}
                  disabled={saving}
                  className="gap-2"
                >
                  <Clipboard className="w-4 h-4" />
                  Paste
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editThumbnail">Thumbnail URL</Label>
                <Input
                  id="editThumbnail"
                  value={editThumbnail}
                  onChange={(e) => setEditThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="editName">Level Name</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="editAuthor">Author (legacy - single)</Label>
                <Input
                  id="editAuthor"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                  placeholder="Single author (legacy field)"
                />
              </div>
              
              <div>
                <Label htmlFor="editCreators">Creators (multiple)</Label>
                <Textarea
                  id="editCreators"
                  value={editCreators}
                  onChange={(e) => setEditCreators(e.target.value)}
                  placeholder="Enter creator names (comma or newline separated)&#10;e.g., Creator1, Creator2"
                  className="mt-1 bg-secondary border-border min-h-[60px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For levels with multiple creators. Leave empty to use single Author field.
                </p>
              </div>
              
              <div>
                <Label htmlFor="editAlternativeIds">Alternative Level IDs</Label>
                <Textarea
                  id="editAlternativeIds"
                  value={editAlternativeIds}
                  onChange={(e) => setEditAlternativeIds(e.target.value)}
                  placeholder="Enter alternative level IDs (comma or newline separated)&#10;e.g., low-detail mode versions"
                  className="mt-1 bg-secondary border-border min-h-[80px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Completions on these levels will count as completions for the main level
                </p>
              </div>

              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Optional description shown on the level page (max 1000 chars)"
                  maxLength={1000}
                  className="mt-1 bg-secondary border-border min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editDescription.length}/1000 characters
                </p>
              </div>
              
              {/* Verifier */}
              <div>
                <Label>Verifier</Label>
                <Select value={editVerifier} onValueChange={setEditVerifier}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue placeholder="Select verifier..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No verifier</SelectItem>
                    {allProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.display_name || profile.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setEditingLevel(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditedLevel} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmLevel} onOpenChange={() => setDeleteConfirmLevel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Level?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteConfirmLevel?.name}</strong> from the list.
              All rankings will be updated automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteLevel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Future Level Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmFutureLevel} onOpenChange={() => setDeleteConfirmFutureLevel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Future Level?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteConfirmFutureLevel?.name}</strong> from the future list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteFutureLevel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Level Rater Confirmation */}
      <AlertDialog open={!!deleteConfirmRater} onOpenChange={() => setDeleteConfirmRater(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Remove Level Rater?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{deleteConfirmRater?.username}</strong> as a level rater and
              revoke all of their list access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeLevelRater}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Edit Future Level Modal */}
      {editingFutureLevel && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditingFutureLevel(null)}>
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 my-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Edit Future Level
            </h2>
            
            <div className="space-y-4">
              {/* Thumbnail Preview with Upload */}
              <div className="aspect-video rounded-lg bg-secondary overflow-hidden relative group">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={editFutureThumbnailInputRef}
                  onChange={handleFutureThumbnailUpload}
                />
                {editFutureThumbnail ? (
                  <img src={editFutureThumbnail} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Image className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => editFutureThumbnailInputRef.current?.click()}
                    disabled={uploadingFutureThumbnail}
                    className="gap-2"
                  >
                    {uploadingFutureThumbnail ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    Upload
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePasteFutureThumbnail}
                    disabled={uploadingFutureThumbnail}
                    className="gap-2"
                  >
                    <Clipboard className="w-4 h-4" />
                    Paste
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="editFutureThumbnail">Thumbnail URL</Label>
                <Input
                  id="editFutureThumbnail"
                  value={editFutureThumbnail}
                  onChange={(e) => setEditFutureThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 bg-secondary border-border"
                />
              </div>

              <div>
                <Label htmlFor="editFutureDescription">Description</Label>
                <Textarea
                  id="editFutureDescription"
                  value={editFutureDescription}
                  onChange={(e) => setEditFutureDescription(e.target.value)}
                  placeholder="Optional description shown on the level page (max 1000 chars)"
                  maxLength={1000}
                  className="mt-1 bg-secondary border-border min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editFutureDescription.length}/1000 characters
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFutureRank">Estimated Rank</Label>
                  <Input
                    id="editFutureRank"
                    type="text"
                    inputMode="decimal"
                    value={editFutureRank}
                    onChange={(e) => setEditFutureRank(e.target.value)}
                    className="mt-1 bg-secondary border-border"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Use rank.sub (e.g. 5.2) to place inside a tied group.
                  </p>
                </div>
                <div>
                  <Label htmlFor="editFuturePoints">Points</Label>
                  <Input
                    id="editFuturePoints"
                    type="number"
                    value={editFuturePoints}
                    onChange={(e) => setEditFuturePoints(e.target.value)}
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="editFutureName">Level Name</Label>
                <Input
                  id="editFutureName"
                  value={editFutureName}
                  onChange={(e) => setEditFutureName(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="editFutureAuthor">Author</Label>
                <Input
                  id="editFutureAuthor"
                  value={editFutureAuthor}
                  onChange={(e) => setEditFutureAuthor(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setEditingFutureLevel(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditedFutureLevel} disabled={savingFutureLevel}>
                {savingFutureLevel ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Extra Level Modal */}
      {editingExtendedLevel && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditingExtendedLevel(null)}>
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 my-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Edit Extra Level
            </h2>
            
            <div className="space-y-4">
              {/* Thumbnail Preview with Upload */}
              <div className="aspect-video rounded-lg bg-secondary overflow-hidden relative group">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={editExtendedThumbnailInputRef}
                  onChange={handleExtendedThumbnailUpload}
                />
                {editExtendedThumbnail ? (
                  <img src={editExtendedThumbnail} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Image className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => editExtendedThumbnailInputRef.current?.click()}
                    disabled={uploadingExtendedThumbnail}
                    className="gap-2"
                  >
                    {uploadingExtendedThumbnail ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    Upload
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePasteExtendedThumbnail}
                    disabled={uploadingExtendedThumbnail}
                    className="gap-2"
                  >
                    <Clipboard className="w-4 h-4" />
                    Paste
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="editExtendedThumbnail">Thumbnail URL</Label>
                <Input
                  id="editExtendedThumbnail"
                  value={editExtendedThumbnail}
                  onChange={(e) => setEditExtendedThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="editExtendedRank">Rank</Label>
                <Input
                  id="editExtendedRank"
                  type="number"
                  value={editExtendedRank}
                  onChange={(e) => setEditExtendedRank(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>

              <div>
                <Label htmlFor="editExtendedDescription">Description</Label>
                <Textarea
                  id="editExtendedDescription"
                  value={editExtendedDescription}
                  onChange={(e) => setEditExtendedDescription(e.target.value)}
                  placeholder="Optional description shown on the level page (max 1000 chars)"
                  maxLength={1000}
                  className="mt-1 bg-secondary border-border min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editExtendedDescription.length}/1000 characters
                </p>
              </div>
              
              <div>
                <Label htmlFor="editExtendedName">Level Name</Label>
                <Input
                  id="editExtendedName"
                  value={editExtendedName}
                  onChange={(e) => setEditExtendedName(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="editExtendedAuthor">Author (legacy - single)</Label>
                <Input
                  id="editExtendedAuthor"
                  value={editExtendedAuthor}
                  onChange={(e) => setEditExtendedAuthor(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                  placeholder="Single author (legacy field)"
                />
              </div>
              
              <div>
                <Label htmlFor="editExtendedCreators">Creators (multiple)</Label>
                <Textarea
                  id="editExtendedCreators"
                  value={editExtendedCreators}
                  onChange={(e) => setEditExtendedCreators(e.target.value)}
                  placeholder="Enter creator names (comma or newline separated)&#10;e.g., Creator1, Creator2"
                  className="mt-1 bg-secondary border-border min-h-[60px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For levels with multiple creators. Leave empty to use single Author field.
                </p>
              </div>
              
              <div>
                <Label htmlFor="editExtendedVerifier">Verifier</Label>
                <Select value={editExtendedVerifier} onValueChange={setEditExtendedVerifier}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue placeholder="Select verifier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {allProfiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.display_name || profile.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="editExtendedAlternativeIds">Alternative Level IDs</Label>
                <Textarea
                  id="editExtendedAlternativeIds"
                  value={editExtendedAlternativeIds}
                  onChange={(e) => setEditExtendedAlternativeIds(e.target.value)}
                  placeholder="Alternative level IDs (comma or newline separated)&#10;Used for syncing completions from remakes"
                  className="mt-1 bg-secondary border-border min-h-[60px]"
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setEditingExtendedLevel(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditedExtendedLevel} disabled={savingExtendedLevel}>
                {savingExtendedLevel ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Manual Run Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmManualRun} onOpenChange={() => setDeleteConfirmManualRun(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Manual Run?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this manual run from <strong>{deleteConfirmManualRun?.profile_username}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteManualRun}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submission Review Modal */}
      {reviewingSubmission && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 w-full max-w-md space-y-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Review Submission
            </h2>
            
            <div className="space-y-4">
              {reviewingSubmission.thumbnail_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={reviewingSubmission.thumbnail_url} 
                    alt={reviewingSubmission.level_name || ""} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}
              
              <div className="p-3 bg-secondary/50 rounded-lg">
                <div className="font-medium text-foreground">
                  {reviewingSubmission.level_name || reviewingSubmission.level_id}
                </div>
                <div className="text-sm text-muted-foreground">
                  by {reviewingSubmission.author || "Unknown"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Submitted by {displaySubmitter(reviewingSubmission.submitted_by, reviewingSubmission.submitted_by_email)}
                </div>
              </div>

              <div>
                <Label>Target List</Label>
                <select
                  value={submissionTargetList}
                  onChange={(e) => setSubmissionTargetList(e.target.value as "main" | "extra" | "future")}
                  className="mt-1 w-full h-10 px-3 bg-secondary border border-border rounded-md text-foreground text-sm"
                >
                  <option value="main">Main List</option>
                  <option value="extra">Extra List</option>
                  <option value="future">Future List</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Submitter requested: {reviewingSubmission.target_list === "main" ? "Main" : reviewingSubmission.target_list === "extra" ? "Extra" : "Future"}
                </p>
              </div>

              <div>
                <Label htmlFor="submissionRank">Final Rank (suggested: #{reviewingSubmission.suggested_rank})</Label>
                <Input
                  id="submissionRank"
                  type="number"
                  min={1}
                  value={submissionRank}
                  onChange={(e) => setSubmissionRank(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                  placeholder={`1-${levels.length + 1}`}
                />
              </div>

              <div>
                <Label htmlFor="submissionNote">Admin Note (optional)</Label>
                <Input
                  id="submissionNote"
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                  placeholder="Reason for approval/rejection..."
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setReviewingSubmission(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleSubmissionReview(reviewingSubmission.id, "rejected")}
                variant="outline"
                className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/10"
                disabled={processingSubmission === reviewingSubmission.id}
              >
                Reject
              </Button>
              <Button 
                onClick={() => handleSubmissionReview(reviewingSubmission.id, "approved")}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={processingSubmission === reviewingSubmission.id || !submissionRank}
              >
                {processingSubmission === reviewingSubmission.id ? "Processing..." : `Approve at #${submissionRank}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Run Submission Review Modal */}
      {reviewingRunSubmission && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Review Run Submission
            </h2>
            
            <div className="space-y-4">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <div className="font-medium text-foreground flex items-center gap-2">
                  {reviewingRunSubmission.username}
                  {reviewingRunSubmission.is_verifier && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Verifier</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Level: {reviewingRunSubmission.level_name || reviewingRunSubmission.level_id}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Submitted by {displaySubmitter(reviewingRunSubmission.submitted_by, reviewingRunSubmission.submitted_by_email)}
                </div>
                <a 
                  href={reviewingRunSubmission.proof_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-sm mt-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Proof
                </a>
              </div>

              <div>
                <Label htmlFor="runSubmissionTime">Time (seconds) *</Label>
                <Input
                  id="runSubmissionTime"
                  type="number"
                  step="0.001"
                  min="0"
                  value={runSubmissionTime}
                  onChange={(e) => setRunSubmissionTime(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                  placeholder="e.g., 123.456"
                />
              </div>

              <div>
                <Label htmlFor="runSubmissionDate">Completion Date *</Label>
                <Input
                  id="runSubmissionDate"
                  type="date"
                  value={runSubmissionDate}
                  onChange={(e) => setRunSubmissionDate(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>

              <div>
                <Label>Arrow</Label>
                <Select value={runSubmissionArrow} onValueChange={setRunSubmissionArrow}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Energy Arrow">Energy Arrow</SelectItem>
                    <SelectItem value="Speedy Arrow">Speedy Arrow</SelectItem>
                    <SelectItem value="Narrow Arrow">Narrow Arrow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="runSubmissionNote">Admin Note (optional)</Label>
                <Input
                  id="runSubmissionNote"
                  value={runSubmissionNote}
                  onChange={(e) => setRunSubmissionNote(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                  placeholder="Reason for approval/rejection..."
                />
              </div>

              {/* Edit submission data section */}
              <div className="border-t border-border pt-4">
                <Label className="text-sm font-medium text-muted-foreground">Edit Submission Data</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-xs">Username</Label>
                    <Input
                      value={reviewingRunSubmission.username}
                      onChange={(e) => {
                        setReviewingRunSubmission({...reviewingRunSubmission, username: e.target.value});
                        updateRunSubmission(reviewingRunSubmission.id, { username: e.target.value });
                      }}
                      className="mt-1 bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Level ID</Label>
                    <Input
                      value={reviewingRunSubmission.level_id}
                      onChange={(e) => {
                        setReviewingRunSubmission({...reviewingRunSubmission, level_id: e.target.value});
                        updateRunSubmission(reviewingRunSubmission.id, { level_id: e.target.value });
                      }}
                      className="mt-1 bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    id="editIsVerifier"
                    checked={reviewingRunSubmission.is_verifier}
                    onChange={(e) => {
                      setReviewingRunSubmission({...reviewingRunSubmission, is_verifier: e.target.checked});
                      updateRunSubmission(reviewingRunSubmission.id, { is_verifier: e.target.checked });
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="editIsVerifier" className="text-sm">Verifier run</Label>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setReviewingRunSubmission(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleRunSubmissionReview(reviewingRunSubmission.id, "rejected")}
                variant="outline"
                className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/10"
                disabled={processingRunSubmission === reviewingRunSubmission.id}
              >
                Reject
              </Button>
              <Button 
                onClick={() => handleRunSubmissionReview(reviewingRunSubmission.id, "approved")}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={processingRunSubmission === reviewingRunSubmission.id || !runSubmissionTime || !runSubmissionDate}
              >
                {processingRunSubmission === reviewingRunSubmission.id ? "Processing..." : "Approve & Add Run"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rank Change Confirmation Dialog */}
      <AlertDialog open={!!rankConfirmLevel} onOpenChange={(open) => !open && setRankConfirmLevel(null)}>
        <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Rank Change
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to change the rank of <strong className="text-foreground">{rankConfirmLevel?.name || rankConfirmLevel?.level_id}</strong>
              </p>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">#{rankConfirmLevel?.rank_position}</div>
                  <div className="text-xs text-muted-foreground">Current</div>
                </div>
                <ArrowUpDown className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">#{pendingNewRank}</div>
                  <div className="text-xs text-muted-foreground">New</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This will update all affected level rankings and point values. This action will be logged and a Discord notification will be sent.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setRankConfirmLevel(null); setPendingNewRank(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeRankChange} className="bg-primary hover:bg-primary/90">
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extra List Rank Change Confirmation */}
      <AlertDialog open={!!extendedRankConfirmLevel} onOpenChange={(open) => { if (!open) { setExtendedRankConfirmLevel(null); setPendingExtendedRank(null); } }}>
        <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Rank Change
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to change the rank of <strong className="text-foreground">{extendedRankConfirmLevel?.name || extendedRankConfirmLevel?.level_id}</strong> on the Extra List
              </p>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">#{extendedRankConfirmLevel?.rank_position}</div>
                  <div className="text-xs text-muted-foreground">Current</div>
                </div>
                <ArrowUpDown className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">#{pendingExtendedRank}</div>
                  <div className="text-xs text-muted-foreground">New</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This will update all affected Extra List rankings and point values. This action will be logged and a Discord notification will be sent.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setExtendedRankConfirmLevel(null); setPendingExtendedRank(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeExtendedRankChange} className="bg-primary hover:bg-primary/90">
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>




      {/* Move to Main Confirmation Dialog */}
      <AlertDialog open={!!moveToMainConfirm} onOpenChange={(open) => !open && setMoveToMainConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Move to Main List?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to move <strong className="text-foreground">{moveToMainConfirm?.name || moveToMainConfirm?.level_id}</strong> from the Extra List to the Main List.
              </p>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-muted-foreground">Extra #{moveToMainConfirm?.rank_position}</div>
                  <div className="text-xs text-muted-foreground">Current</div>
                </div>
                <ChevronUp className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">Main #{levels.length + 1}</div>
                  <div className="text-xs text-muted-foreground">New</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This will add the level to the main list and award points. A Discord notification will be sent.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (moveToMainConfirm) {
                  transferExtendedToMain(moveToMainConfirm);
                  setMoveToMainConfirm(null);
                }
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Move to Main
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move to Extra Confirmation Dialog */}
      <AlertDialog open={!!moveToExtraConfirm} onOpenChange={(open) => !open && setMoveToExtraConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Move to Extra List?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to move <strong className="text-foreground">{moveToExtraConfirm?.name || moveToExtraConfirm?.level_id}</strong> from the Main List to the Extra List.
              </p>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-muted-foreground">Main #{moveToExtraConfirm?.rank_position}</div>
                  <div className="text-xs text-muted-foreground">Current</div>
                </div>
                <ChevronDown className="w-6 h-6 text-accent" />
                <div className="text-center">
                  <div className="text-lg font-bold text-accent">Extra #{extendedLevels.length + 1}</div>
                  <div className="text-xs text-muted-foreground">New</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This will remove the level from the main list (no points) and add it to the extra list. All main list levels will be re-ranked.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (moveToExtraConfirm) {
                  transferMainToExtended(moveToExtraConfirm);
                  setMoveToExtraConfirm(null);
                }
              }}
              className="bg-accent hover:bg-accent/90"
            >
              Move to Extra
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Merge Confirmation Dialog */}
      <AlertDialog open={mergeConfirmOpen} onOpenChange={setMergeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Profile Merge
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>You are about to merge:</p>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center p-3 bg-destructive/10 rounded-lg">
                  <div className="text-lg font-bold text-destructive">{mergeSourceProfile}</div>
                  <div className="text-xs text-muted-foreground">Will be deleted</div>
                </div>
                <ChevronUp className="w-6 h-6 text-primary rotate-90" />
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <div className="text-lg font-bold text-primary">{mergeTargetProfile}</div>
                  <div className="text-xs text-muted-foreground">Will receive all data</div>
                </div>
              </div>
              {mergeDisplayName && (
                <p className="text-sm text-muted-foreground">
                  Display name will be set to: <strong className="text-foreground">{mergeDisplayName}</strong>
                </p>
              )}
              <p className="text-sm text-destructive">
                ⚠️ This action cannot be undone. All completions, runs, and verifier credits will be transferred.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={mergeProfiles}
              disabled={mergingProfiles}
              className="bg-primary hover:bg-primary/90"
            >
              {mergingProfiles ? "Merging..." : "Confirm Merge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hard Delete Profile Confirmation */}
      <AlertDialog open={hardDeleteConfirmOpen} onOpenChange={setHardDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Hard Delete Profile
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {(() => {
                const selected = allProfiles.find(p => p.id === hardDeleteSelectedId);
                if (!selected) return <p>No profile selected.</p>;
                return (
                  <>
                    <p>You are about to permanently remove:</p>
                    <div className="text-center p-3 bg-destructive/10 rounded-lg">
                      <div className="text-lg font-bold text-destructive">@{selected.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {selected.total_points ?? 0} main pts • {selected.extra_points ?? 0} extra pts
                      </div>
                    </div>
                    <p className="text-sm text-destructive">
                      ⚠️ This deletes the profile plus ALL their completions, manual runs, extra completions, claim requests, and watchlist entries. A snapshot is saved to the archive so you can restore it.
                    </p>
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={hardDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={hardDeleteProfile}
              disabled={hardDeleting || !hardDeleteSelectedId}
              className="bg-destructive hover:bg-destructive/90"
            >
              {hardDeleting ? "Deleting..." : "Confirm Hard Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
