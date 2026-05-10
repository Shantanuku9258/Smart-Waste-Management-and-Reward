package com.smartwaste.dto;

public class EwastePredictionRequestDTO {
    private String state;
    private Integer year;
    private Integer month;
    private Double collectionCentres;

    // Getters and Setters
    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public Double getCollectionCentres() {
        return collectionCentres;
    }

    public void setCollectionCentres(Double collectionCentres) {
        this.collectionCentres = collectionCentres;
    }
}
