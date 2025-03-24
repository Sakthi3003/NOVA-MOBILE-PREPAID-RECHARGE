package com.nova.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class PlanCreateDTO {
    @NotNull(message = "Category ID cannot be null")
    private Long categoryId;

    @NotBlank(message = "Name cannot be blank")
    private String name;

    @NotNull(message = "Price cannot be null")
    @Positive(message = "Price must be positive")
    private Double price;

    @NotBlank(message = "Validity cannot be blank")
    private String validity;

    private String data;
    private String sms;
    private String calls;
    private String benefit1;
    private String benefit2;

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public String getValidity() { return validity; }
    public void setValidity(String validity) { this.validity = validity; }
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
    public String getSms() { return sms; }
    public void setSms(String sms) { this.sms = sms; }
    public String getCalls() { return calls; }
    public void setCalls(String calls) { this.calls = calls; }
    public String getBenefit1() { return benefit1; }
    public void setBenefit1(String benefit1) { this.benefit1 = benefit1; }
    public String getBenefit2() { return benefit2; }
    public void setBenefit2(String benefit2) { this.benefit2 = benefit2; }
}