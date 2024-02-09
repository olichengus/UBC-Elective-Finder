import "./add.css";
import React, { useState } from 'react';
import axios from 'axios'
// Define the InsightResult type
// Component based on AI generated response
const GetAverageComponent = () => {


	const [enterAverage, setEnterAverage] = useState(0);
	const [resultMessage, setResultMessage] = useState('');
	const [sectionData, setSectionData] = useState([]);


	const handleAverageInput = (event) => {
		const inputValue = event.target.value.replace(/\D/g, '');
		setEnterAverage(inputValue);
	};

	const handleSubmit = async () => {
		const number = parseInt(enterAverage, 10);

		if (number < 100) {
			try {
				const response = await axios.post('http://localhost:3000/query', {
					WHERE: {
						AND:[{
							GT: {
								sections_avg: number,
							},
						},{
							NOT:{
								IS:{
									sections_id: "5*"
								}
							}
						},{
							NOT:{
								IS:{
									sections_id: "6*"
								}
							}
						}
						]
					},
					OPTIONS: {
						COLUMNS: [
							"sections_dept",
							"sections_id",
							"sections_title",
							"overallAvg",
						],
						ORDER: {
							dir: "DOWN",
							keys: [
								"overallAvg",
								"sections_id",
								"sections_dept",
								"sections_title"
							]
						},
					},
					TRANSFORMATIONS: {
						GROUP: [
							"sections_dept",
							"sections_id",
							"sections_title",
						],
						APPLY: [
							{
								overallAvg: {
									AVG: "sections_avg",
								},
							},
						],
					},
				});
				// Handle the response data
				setSectionData(response.data.result);
				setResultMessage("Here are the classes with at least this average");
			} catch (error) {
				console.error('Error calling the web server:', error);
				setResultMessage('Error calling the server');
			}
		} else {
			setSectionData([])
			setResultMessage('Please choose an average between 0-100');
		}
	};

	return (
		<div>
			<h2>Choose your average threshold</h2>
			<label htmlFor="numberInput">Enter a Number: </label>
			<input
				type="text"
				id="numberInput"
				value={enterAverage}
				onChange={handleAverageInput}
			/>
			<button onClick={handleSubmit}>Submit</button>
			<p>{resultMessage}</p>
			{/*<p>{sectionData}</p>*/}
			{sectionData.length > 0 && (
				<div>
					<h3>Resulting Data</h3>
					<table>
						<thead>
						<tr>
							<th>Department</th>
							<th>Class Number</th>
							<th>Name</th>
							<th>Overall Average</th>
						</tr>
						</thead>
						<tbody>
						{sectionData.map((section) => (
							<tr>
								<td>{section.sections_dept}</td>
								<td>{section.sections_id}</td>
								<td>{section.sections_title}</td>
								<td>{section.overallAvg}</td>
							</tr>
						))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
};

export default GetAverageComponent;

