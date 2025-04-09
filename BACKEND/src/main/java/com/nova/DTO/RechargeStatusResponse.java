package com.nova.DTO;


public class RechargeStatusResponse {
    private boolean updated;

    public RechargeStatusResponse(boolean updated) {
        this.updated = updated;
    }

    public boolean isUpdated() { return updated; }
    public void setUpdated(boolean updated) { this.updated = updated; }
}
