class UI5KPICard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._root = document.createElement("div");
    this.shadowRoot.appendChild(this._root);

    this.title = "Revenue";
    this.subtitle = "Current value";
    this.prefix = "";
    this.suffix = "";
    this.showTrend = false;
    this.trendValue = 0;
    this.trendLabel = "vs previous period";
  }

  onCustomWidgetBeforeUpdate(changedProperties) {
    Object.keys(changedProperties || {}).forEach((key) => {
      this[key] = changedProperties[key];
    });
    this._render();
  }

  onCustomWidgetAfterUpdate() {
    this._render();
  }

  onCustomWidgetResize() {
    this._render();
  }

  setTitle(title) {
    this.title = title || "KPI";
    this._render();
  }

  setSubtitle(subtitle) {
    this.subtitle = subtitle || "";
    this._render();
  }

  setTrend(value, label) {
    this.trendValue = Number(value) || 0;
    this.trendLabel = label || "vs previous period";
    this.showTrend = true;
    this._render();
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _formatNumber(value) {
    const n = Number(String(value).replace(/,/g, ""));
    if (!Number.isFinite(n)) return String(value ?? "--");

    if (Math.abs(n) >= 1000000000)
      return (n / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";

    if (Math.abs(n) >= 1000000)
      return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";

    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2
    }).format(n);
  }

  _readSACValue() {
    try {
      const binding = this.dataBindings?.getDataBinding("kpiData");
      const data = binding?.data;

      if (!Array.isArray(data) || data.length === 0) {
        return { value: "--", label: this.title };
      }

      const row = data[0];

      if (row?.mainStructureMembers) {
        const keys = Object.keys(row.mainStructureMembers);
        if (keys.length > 0) {
          const member = row.mainStructureMembers[keys[0]];
          const raw =
            member?.formattedValue ??
            member?.rawValue ??
            member?.value;

          if (raw !== undefined && raw !== null) {
            return {
              value: raw,
              label: member?.label || this.title
            };
          }
        }
      }

      const findValue = (obj) => {
        if (!obj || typeof obj !== "object") return null;
        if (obj.formattedValue != null) return obj.formattedValue;
        if (obj.rawValue != null) return obj.rawValue;
        if (obj.value != null && typeof obj.value !== "object") return obj.value;

        for (const key of Object.keys(obj)) {
          const result = findValue(obj[key]);
          if (result != null) return result;
        }
        return null;
      };

      return { value: findValue(row) ?? "--", label: this.title };
    } catch (e) {
      console.warn("UI5 KPI Card data binding error:", e);
      return { value: "--", label: this.title };
    }
  }

  _render() {
    const result = this._readSACValue();

    const displayValue =
      result.value === "--"
        ? "--"
        : (this.prefix || "") +
          this._formatNumber(result.value) +
          (this.suffix || "");

    const trend = Number(this.trendValue) || 0;
    const trendClass = trend >= 0 ? "positive" : "negative";
    const trendIcon = trend >= 0 ? "▲" : "▼";

    this._root.innerHTML = `
      <style>
        :host {
          display:block;width:100%;height:100%;min-width:180px;min-height:110px;
          font-family:"72","72full",Arial,sans-serif;box-sizing:border-box;
        }
        .card {
          box-sizing:border-box;width:100%;height:100%;min-height:110px;
          background:#fff;border:1px solid #d9d9d9;border-radius:12px;
          padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,.08);
          display:flex;flex-direction:column;justify-content:space-between;
          overflow:hidden;
        }
        .header {display:flex;align-items:center;justify-content:space-between;gap:10px;}
        .title {color:#1d2d3e;font-size:15px;font-weight:600;line-height:1.25;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .accent {width:8px;height:8px;border-radius:50%;background:#0a6ed1;flex:0 0 auto;}
        .subtitle {margin-top:3px;color:#6a6d70;font-size:12px;}
        .value {margin-top:10px;color:#1d2d3e;font-size:clamp(26px,5vw,42px);
          font-weight:700;letter-spacing:-.5px;line-height:1;white-space:nowrap;
          overflow:hidden;text-overflow:ellipsis;}
        .trend {margin-top:10px;font-size:12px;font-weight:600;}
        .positive {color:#107e3e}.negative {color:#bb0000}
      </style>
      <div class="card">
        <div>
          <div class="header">
            <div class="title">${this._escape(this.title || result.label || "KPI")}</div>
            <div class="accent"></div>
          </div>
          <div class="subtitle">${this._escape(this.subtitle || "")}</div>
          <div class="value">${this._escape(displayValue)}</div>
        </div>
        ${
          this.showTrend
            ? `<div class="trend ${trendClass}">${trendIcon} ${Math.abs(trend).toFixed(1)}% ${this._escape(this.trendLabel)}</div>`
            : ""
        }
      </div>
    `;
  }
}

customElements.define("com-lokesh-sac-ui5kpicard-1", UI5KPICard);
