const { MongoClient } = require('mongodb');


function createReservationDocument(nameOfListing, reservationDates, reservationDetails) {
    // Create the reservation
    let reservation = {
        name: nameOfListing,
        dates: reservationDates,
    }
    // Add additional properties from reservationDetails to the reservation
    for (let detail in reservationDetails) {
        reservation[detail] = reservationDetails[detail];
    }
    return reservation;
}


async function createReservation(client, userEmail, nameOfListing, reservationDates, reservationDetails) {

    const usersCollection = client.db("sample_airbnb").collection("users");
    const listingsAndReviewsCollection = client.db("sample_airbnb").collection("listeningAndReviews");

    const reservation = createReservationDocument(nameOfListing, reservationDates, reservationDetails);


    const session = client.startSession();

    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
    };

    try {
        const transactionResults = await session.withTransaction(async () => {
            const usersUpdateResults = await usersCollection.updateOne(
                { email: userEmail },
                { $addToSet: { reservations: reservation } },
                { session });
            console.log(`${usersUpdateResults.matchedCount} document(s) found in the users collection with the email address ${userEmail}.`);
            console.log(`${usersUpdateResults.modifiedCount} document(s) was/were updated to include the reservation.`);
            const isListingReservedResults = await listingsAndReviewsCollection.findOne(
                { name: nameOfListing, datesReserved: { $in: reservationDates } },
                { session });
            if (isListingReservedResults) {
                await session.abortTransaction();
                console.error("This listing is already reserved for at least one of the given dates. The reservation could not be created.");
                console.error("Any operations that already occurred as part of this transaction will be rolled back.");
                return;
            }
            const listingsAndReviewsUpdateResults = await listingsAndReviewsCollection.updateOne(
                { name: nameOfListing },
                { $addToSet: { datesReserved: { $each: reservationDates } } },
                { session });
            console.log(`${listingsAndReviewsUpdateResults.matchedCount} document(s) found in the listingsAndReviews collection with the name ${nameOfListing}.`);
            console.log(`${listingsAndReviewsUpdateResults.modifiedCount} document(s) was/were updated to include the reservation dates.`);
        }, transactionOptions);
        if (transactionResults) {
            console.log("The reservation was successfully created.");
        } else {
            console.log("The transaction was intentionally aborted.");
        }
    } catch(e){
        console.log("The transaction was aborted due to an unexpected error: " + e);
    } finally {
        await session.endSession();
    }



}



async function main() {

    
    const uri = "mongodb+srv://webtech2022:webtech2022@cluster0.t7xdp.mongodb.net/sample_airbnb?retryWrites=true&w=majority";
    

    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        createReservationDocument("Infinite Views",
        [new Date("2020-23-04")],
        { pricePerNight: 180, specialRequests: "Late checkout", breakfastIncluded: true });

        createReservationDocument("Къщата",
        [new Date("2021-23-04")],
        { pricePerNight: 160, specialRequests: "Late checkout", breakfastIncluded: false });


        // Make the appropriate DB calls
        await createReservation(client,
            "leslie@example.com",
            "Infinite Views",
            [new Date("2022-23-04")],
            { pricePerNight: 180, specialRequests: "Late checkout", breakfastIncluded: true });

        await createReservation(client,
            "dancho@email.bg",
            "Къщата",
            [new Date("2022-23-04")],
            { pricePerNight: 160, specialRequests: "Late checkout", breakfastIncluded: false });

        await createReservation(client,
            "deyvid@email.bg",
            "Къщата",
            [new Date("2022-23-04")],
            { pricePerNight: 160, specialRequests: "Late checkout", breakfastIncluded: false });


    } finally {

        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

main().catch(console.error);

// Add functions that make DB calls here