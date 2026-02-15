// TASK - ZU:
function sumOfUnique(arr) {
	let sum = 0;

	for (let i = 0; i < arr.length; i++) {
		let count = 0;

		for (let j = 0; j < arr.length; j++) {
			if (arr[i] === arr[j]) {
				count++;
			}
		}

		if (count === 1) {
			sum += arr[i];
		}
	}

	return sum;
}

console.log(sumOfUnique([1, 2, 3, 2]));
console.log(sumOfUnique([4, 5, 6, 5, 4, 7]));

// TASK - ZT:

// function firstUniqueCharIndex(str: string): number {
// 	const count: Record<string, number> = {};
// 	for (let char of str) {
// 		count[char] = (count[char] || 0) + 1;
// 	}

// 	for (let i = 0; i < str.length; i++) {
// 		if (count[str[i]] === 1) {
// 			return i;
// 		}
// 	}
// 	return -1;
// }
// console.log(firstUniqueCharIndex('stamp'));

// TASK - ZS:

// function singleNumber(arr: number[]): number {
// 	let result = 0;

// 	for (let num of arr) {
// 		result ^= num;
// 	}

// 	return result;
// }
// console.log(singleNumber([4, 2, 1, 2, 1]));

// TASK - ZQ

// function findDuplicates(arr: number[]): number[] {
// 	const counts: Record<number, number> = {};
// 	const result: number[] = [];

// 	for (let num of arr) {
// 		counts[num] = (counts[num] || 0) + 1;
// 	}

// 	for (let num in counts) {
// 		if (counts[num] > 1) {
// 			result.push(Number(num));
// 		}
// 	}

// 	return result;
// }

// // 🔍 Test
// console.log(findDuplicates([1, 2, 3, 4, 5, 4, 3, 4])); // [3, 4]

// TASK - ZO:
// function areArraysEqual(arr1: number[], arr2: number[]): boolean {
// 	return arr1.every((item) => arr2.includes(item));
// }

// console.log(areArraysEqual([1, 2, 3], [3, 1, 2]));
// console.log(areArraysEqual([1, 2, 3], [3, 1, 2, 1]));
// console.log(areArraysEqual([1, 2, 3], [4, 1, 2]));

// TASK - ZN:
// function rotateArray(arr: number[], index: number): number[] {
// 	if (index < 0 || index >= arr.length) return arr;

// 	const before = arr.slice(0, index);
// 	const current = arr[index];
// 	const after = arr.slice(index + 1);

// 	return [...after, ...before, current];
// }

// console.log(rotateArray([1, 2, 3, 4, 5, 6], 3));

// TASK - ZL:
// function stringToKebab(str: string): string {
// 	return str.toLowerCase().trim().replace(/\s+/g, '-');
// }

// console.log(stringToKebab('I love Kebab'));
// console.log(stringToKebab('JavaScript Is FUN'));

// TASK - ZM:
// function reverseInteger(num: number): number {
// 	return Number(num.toString().split('').reverse().join(''));
// }

// console.log(reverseInteger(123456789));

//  MITASK - ZK:
// function printNumbers() {
// 	let count = 1;

// 	const interval = setInterval(() => {
// 		console.log(count);

// 		if (count === 5) {
// 			clearInterval(interval); // 5 ga yetganda to'xtaydi
// 		}

// 		count++;
// 	}, 1000);
// }

// printNumbers();

// MITASK - ZJ:
// function reduceNestedArray(arr: any[]): number {
// 	let sum = 0;

// 	for (let item of arr) {
// 		if (Array.isArray(item)) {
// 			sum += reduceNestedArray(item);
// 		} else {
// 			sum += item;
// 		}
// 	}

// 	return sum;
// }

// console.log(reduceNestedArray([1, [1, 2, [4]]])); // 8
