const request = require("supertest");
const expect = require("chai").expect;
const dotenv = require("dotenv");
const fs = require('fs');

dotenv.config();

const BASE_URL = "https://restful-booker.herokuapp.com";
let token;
let bookingId;
let bookingData = JSON.parse(fs.readFileSync("data/bookingData.json", "utf8"));

async function getAuthToken() {
    const response = await request(BASE_URL)
    .post("/auth")
    .send({
        username: process.env.API_USERNAME,
        password: process.env.API_PASSWORD,
    });

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("token");

    return response.body.token;
}

async function createBooking(payload) {
    const response = await request(BASE_URL)
        .post("/booking")
        .set("Content-Type", "application/json")
        .set("Accept", "application/json")
        .send(payload);

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('bookingid');

    return {
        bookingId: response.body.bookingid,
        booking: response.body.booking,
    };
}

async function getBookingById(id) {
    const response = await request(BASE_URL)
    .get(`/booking/${id}`)
    .set("Accept", "application/json")
    .set("Content-Type", "application/json");

    expect(response.status).to.equal(200);
    return response.body;
}

async function deleteBookingById(id, token) {
    const response = await request(BASE_URL)
        .delete(`/booking/${id}`)
        .set("Cookie", [`token=${token}`])
        .set("Accept", "application/json")
        .set("Content-Type", "application/json");

    expect(response.status).to.be.oneOf([200,201]);
}

describe("Booking API E2E Test", function () {
    this.timeout(5000);

    before(async function () {
        token = await getAuthToken();
    });

    it("Create Booking", async function() {
        const result = await createBooking(bookingData);
        bookingId = result.bookingId;

        const booking = result.booking;
        expect(booking.firstname).to.equal(bookingData.firstname);
        expect(booking.lastname).to.equal(bookingData.lastname);
        expect(booking.totalprice).to.equal(bookingData.totalprice);
        expect(booking.depositpaid).to.equal(bookingData.depositpaid);
        expect(booking.bookingdates.checkin).to.equal(bookingData.bookingdates.checkin);
        expect(booking.bookingdates.checkout).to.equal(bookingData.bookingdates.checkout);
        expect(booking.additionalneeds).to.equal(bookingData.additionalneeds);
    });

    it("Get Booking", async function() {
        this.timeout(5000);
        if (!bookingId) throw new Error("Booking ID is empty, cannot get booking");

        const booking = await getBookingById(bookingId);

        expect(booking.firstname).to.equal(bookingData.firstname);
        expect(booking.lastname).to.equal(bookingData.lastname);
        expect(booking.totalprice).to.equal(bookingData.totalprice);
        expect(booking.depositpaid).to.equal(bookingData.depositpaid);
        expect(booking.bookingdates.checkin).to.equal(bookingData.bookingdates.checkin);
        expect(booking.bookingdates.checkout).to.equal(bookingData.bookingdates.checkout);
        expect(booking.additionalneeds).to.equal(bookingData.additionalneeds);
    });

    it("Delete Booking", async function() {
        if (!bookingId) throw new Error("Booking ID is empty, cannot delete booking");
        await deleteBookingById(bookingId, token);
    });

});