# Banner Images

Each banner gets its own subfolder. Drop your Photoshop exports in the matching folder.

```
public/banners/
  dragon/          ← Dragon Banner images (5 files)
    showcase.png
    crown-realm.png
    leaderboard.png
    podium.png
    scout-report.png
```

To add a new banner (e.g. Phoenix), create `public/banners/phoenix/` and register
the paths in `src/components/banners/PhoenixBanner/PhoenixBannerImages.tsx`.
