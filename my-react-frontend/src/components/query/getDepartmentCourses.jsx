import "./query.css";
import React, {useState} from 'react';
import axios from "axios";

const GetDepartmentCourses = () => {
	const [enterDept, setDept] = useState('');
	const [resultMessage, setResultMessage] = useState('');
	const [stringData, setStringData] = useState([]);
	const [enterAverage, setEnterAverage] = useState('');


	const handleDeptInput = (event) => {
		setDept(event.target.value);
	};

	const handleAverageInput = (event) => {
		const inputValue = event.target.value.replace(/\D/g, '');
		setEnterAverage(inputValue);
	};

	const handleButtonClick = async () => {
		setStringData("");
	//	const number = parseInt(enterAverage, 10);
		try {
			const whereClause = {
				AND: [
					{
						NOT: {
							IS: {
								sections_id: "5*",
							},
						},
					},
					{
						NOT: {
							IS: {
								sections_id: "6*",
							},
						},
					},
				],
			};

			if (!isNaN(enterAverage)) {
				const number = parseInt(enterAverage, 10);
				if (number) {
					whereClause.AND.push({
						GT: {
							sections_avg: number,
						},
					});
				}
			}

			if (enterDept.trim() !== '') {
				whereClause.AND.push({
					IS: {
						sections_dept: enterDept,
					},
				});
			}


			const response = await axios.post('http://localhost:3000/query', {
				WHERE: whereClause,
				OPTIONS: {
					COLUMNS: [
						"sections_dept",
						"sections_id",
						"sections_title",
						"overallAvg"
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
			setStringData(response.data.result);
			if (response.data.result.length === 0 || parseInt(enterAverage, 10) > 100) {
				setResultMessage('No such courses');
			} else {
				setResultMessage("")
			}

			setDept('');
			setEnterAverage('');
		} catch (error) {
			console.error('Error calling the web server:', error);
			if (parseInt(enterAverage, 10) >100) {
				setResultMessage('Please enter an average 0-100');
			} else {
				setResultMessage('No such courses, or dept does not exist');
			}
		}
	};

	return (
		<div>
			<div className="site-title-box"><h1 className="site-title">Insight UBC</h1></div>
			<div className="input-boxes">
				<input
					type="text"
					id="stringInput"
					value={enterDept}
					onChange={handleDeptInput}
					className="input"
					placeholder="Department (ex: cpsc)"
				/>
				<input
					type="text"
					id="numberInput"
					value={enterAverage}
					onChange={handleAverageInput}
					className="input"
					placeholder="Greater than average"
				/>
			</div>
			<button onClick={handleButtonClick} className="button">Find Courses</button>
			<p>{resultMessage}</p>
			{stringData.length > 0 && (
				<div>
					<table>
						<thead>
						<tr>
							<th>Class</th>
							<th>Title</th>
							<th>Overall Average</th>
						</tr>
						</thead>
						<tbody>
						{stringData.map((section) => (
							<tr key={section.sections_id}>
								<td>{`${section.sections_dept} ${section.sections_id}`}</td>
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
}

export default GetDepartmentCourses;
