const { createTextRecord, listToday } = require("../../utils/api");

function formatTime(value) {
  const time = new Date(value);
  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

Page({
  data: {
    dateLabel: "",
    draft: "",
    canSave: false,
    records: [],
    loading: true,
    saving: false,
    errorMessage: "",
  },

  onLoad() {
    const now = new Date();
    const dateLabel = `${now.getMonth() + 1}月${now.getDate()}日`;
    this.setData({ dateLabel });
  },

  onShow() {
    this.loadToday();
  },

  onPullDownRefresh() {
    this.loadToday().finally(() => wx.stopPullDownRefresh());
  },

  async loadToday() {
    this.setData({ loading: true, errorMessage: "" });
    try {
      const records = await listToday();
      this.setData({
        records: records.map((record) => ({
          ...record,
          displayTime: formatTime(record.occurred_at),
        })),
      });
    } catch (_error) {
      this.setData({
        errorMessage: "无法连接本机记录服务。请确认电脑服务正在运行，且手机与电脑连接同一 Wi‑Fi。",
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  onDraftInput(event) {
    const draft = event.detail.value;
    this.setData({ draft, canSave: draft.trim().length > 0 });
  },

  async saveRecord() {
    const content = this.data.draft.trim();
    if (!content || this.data.saving) return;

    this.setData({ saving: true, errorMessage: "" });
    try {
      const record = await createTextRecord(content);
      this.setData({
        draft: "",
        canSave: false,
        records: [
          { ...record, displayTime: formatTime(record.occurred_at) },
          ...this.data.records,
        ],
      });
      wx.showToast({ title: "已保存在本机", icon: "success" });
    } catch (_error) {
      this.setData({
        errorMessage: "保存失败。请确认电脑服务正在运行，且手机与电脑连接同一 Wi‑Fi。",
      });
    } finally {
      this.setData({ saving: false });
    }
  },
});
