// ===== 文档菜单配置 =====
export const DOC_GROUPS = [
    {
        title: "Bridge",
        files: [
            { path: "bridge/00_Index.md", label: "00 - Index" },
            { path: "bridge/01_Glossary.md", label: "01 - Glossary" },
            { path: "bridge/02_2_1_GF.md", label: "02 - 2/1 GF" },
            { path: "bridge/03_Declarer.md", label: "03 - Declarer" },
            { path: "bridge/04_Defense.md", label: "04 - Defense" },
            { path: "bridge/06_Others.md", label: "06 - Others" },
        ],
    },
    {
        title: "Conventions",
        parent: "Bridge",
        label: "05 - Conventions",
        files: [
            { path: "bridge/05_conventions/00_Index.md", label: "00 - Index" },
            { path: "bridge/05_conventions/01_Opening_1NT.md", label: "01 - Opening 1NT" },
            { path: "bridge/05_conventions/02_Constructive_bidding.md", label: "02 - Constructive" },
            { path: "bridge/05_conventions/03_Slam_bidding.md", label: "03 - Slam" },
            { path: "bridge/05_conventions/04_Defensive_bidding.md", label: "04 - Defensive" },
        ],
    },
];
