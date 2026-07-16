const SkeletonCard = () => (
  <div className="flex flex-col gap-4">
    <div className="relative aspect-video rounded-2xl bg-surface-low overflow-hidden border border-black/5">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>

    <div className="flex gap-4 px-1">
      <div className="w-10 h-10 rounded-full bg-surface-low shrink-0 border border-black/5 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>
      <div className="flex-1 space-y-3 pt-1">
        <div className="h-4 bg-surface-low rounded-lg w-[90%] relative overflow-hidden border border-black/5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
        <div className="h-3 bg-surface-low rounded-lg w-[60%] relative overflow-hidden border border-black/5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  </div>
);

export default SkeletonCard;