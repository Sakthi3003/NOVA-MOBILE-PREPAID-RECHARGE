package com.nova.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "plans")
public class Plan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false, length = 50)
    private String validity;

    @Column(nullable = false, length = 50)
    private String data;

    @Column(nullable = false, length = 50)
    private String sms;

    @Column(nullable = false, length = 50)
    private String calls;

    @Column(length = 40)
    private String benefit1;

    @Column(length = 40)
    private String benefit2;
    
    @Column(nullable = false, length = 50, columnDefinition = "varchar(50) default 'active'")
    private String status;
    

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
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
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
    
}