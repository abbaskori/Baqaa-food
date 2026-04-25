package com.baqaa.analytics.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Order(
    val id: String,
    @SerialName("bill_number")
    val billNumber: Int,
    val total: Double,
    @SerialName("payment_method")
    val paymentMethod: String,
    @SerialName("customer_name")
    val customerName: String? = null,
    @SerialName("created_at")
    val createdAt: String
)

@Serializable
data class Customer(
    val id: String,
    val name: String,
    val phone: String,
    @SerialName("created_at")
    val createdAt: String
)
