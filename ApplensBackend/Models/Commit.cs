// <copyright file="Commit.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

namespace AppLensV3.Models
{
    /// <summary>
    /// Class for commit.
    /// </summary>
    public class Commit
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="Commit"/> class.
        /// </summary>
        /// <param name="sha">The sha.</param>
        /// <param name="author">The author.</param>
        /// <param name="dateTime">Date time.</param>
        /// <param name="previousSha">Previous sha.</param>
        public Commit(string sha, string author, string dateTime, string previousSha)
        {
            Sha = sha;
            Author = author;
            DateTime = dateTime;
            PreviousSha = previousSha;
        }

        /// <summary>
        /// Gets the commit sha.
        /// </summary>
        public string Sha { get; }

        /// <summary>
        /// Gets the commit author.
        /// </summary>
        public string Author { get; }

        /// <summary>
        /// Gets the commit date time.
        /// </summary>
        public string DateTime { get; }

        /// <summary>
        /// Gets previous commit sha.
        /// </summary>
        public string PreviousSha { get; }
    }
}
