package com.nova.DTO;


public class PlanDTO {
 private Long id;
 private CategoryDTO category;
 private String name;
 private Double price;
 private String validity;
 private String data;
 private String sms;
 private String calls;
 private String benefit1;
 private String benefit2;
 private String status;
public Long getId() {
	return id;
}
public void setId(Long id) {
	this.id = id;
}
public CategoryDTO getCategory() {
	return category;
}
public void setCategory(CategoryDTO category) {
	this.category = category;
}
public String getName() {
	return name;
}
public void setName(String name) {
	this.name = name;
}
public Double getPrice() {
	return price;
}
public void setPrice(Double price) {
	this.price = price;
}
public String getValidity() {
	return validity;
}
public void setValidity(String validity) {
	this.validity = validity;
}
public String getData() {
	return data;
}
public void setData(String data) {
	this.data = data;
}
public String getSms() {
	return sms;
}
public void setSms(String sms) {
	this.sms = sms;
}
public String getCalls() {
	return calls;
}
public void setCalls(String calls) {
	this.calls = calls;
}
public String getBenefit1() {
	return benefit1;
}
public void setBenefit1(String benefit1) {
	this.benefit1 = benefit1;
}
public String getBenefit2() {
	return benefit2;
}
public void setBenefit2(String benefit2) {
	this.benefit2 = benefit2;
}
public String getStatus() {
	return status;
}
public void setStatus(String status) {
	this.status = status;
}
}
